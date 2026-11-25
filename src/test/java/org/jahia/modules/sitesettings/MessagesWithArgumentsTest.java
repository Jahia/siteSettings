package org.jahia.modules.sitesettings;

import org.jahia.utils.i18n.Messages;
import org.junit.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Properties;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.junit.Assert.assertTrue;

/**
 * Each message with arguments that the Java code of the module resolves formats through {@link Messages#format}.
 * <p>
 * That method doubles every single quote before {@link java.text.MessageFormat} reads the message, so a quote
 * cannot escape a brace there. A key that only a JSP formats with {@code <fmt:param>} follows plain
 * {@code MessageFormat} instead, and stays out of this check.
 */
public class MessagesWithArgumentsTest {

    private static final Path MODULE = Paths.get(System.getProperty("basedir", ""));
    private static final Path BUNDLES = MODULE.resolve(Paths.get("src", "main", "resources", "resources"));
    private static final Path JAVA_SOURCES = MODULE.resolve(Paths.get("src", "main", "java"));
    private static final Pattern PLACEHOLDER = Pattern.compile("\\{(\\d+)[,}]");
    private static final Pattern STRING_LITERAL = Pattern.compile("\"([A-Za-z0-9_.-]+)\"");

    @Test
    public void everyMessageWithArgumentsOfTheJavaCodeFormatsAndKeepsItsArguments() throws IOException {
        Set<String> javaLiterals = javaStringLiterals();
        List<String> failures = new ArrayList<>();
        int checked = 0;
        try (DirectoryStream<Path> bundles = Files.newDirectoryStream(BUNDLES, "JahiaSiteSettings*.properties")) {
            for (Path bundle : bundles) {
                Properties messages = new Properties();
                try (InputStream in = Files.newInputStream(bundle)) {
                    messages.load(in);
                }
                for (String key : messages.stringPropertyNames()) {
                    String message = messages.getProperty(key);
                    TreeSet<Integer> placeholders = placeholdersOf(message);
                    if (placeholders.isEmpty() || !javaLiterals.contains(key)) {
                        continue;
                    }
                    checked++;
                    String failure = formatJahiaWay(message, placeholders);
                    if (failure != null) {
                        failures.add(bundle.getFileName() + " " + key + ": " + failure);
                    }
                }
            }
        }
        assertTrue("no message with arguments of the Java code found under " + BUNDLES.toAbsolutePath(), checked > 0);
        assertTrue(String.join("\n", failures), failures.isEmpty());
    }

    private static Set<String> javaStringLiterals() throws IOException {
        Set<String> literals = new HashSet<>();
        try (Stream<Path> sources = Files.walk(JAVA_SOURCES)) {
            for (Path source : (Iterable<Path>) sources.filter(p -> p.toString().endsWith(".java"))::iterator) {
                Matcher matcher = STRING_LITERAL.matcher(new String(Files.readAllBytes(source), StandardCharsets.UTF_8));
                while (matcher.find()) {
                    literals.add(matcher.group(1));
                }
            }
        }
        return literals;
    }

    private static TreeSet<Integer> placeholdersOf(String message) {
        TreeSet<Integer> placeholders = new TreeSet<>();
        Matcher matcher = PLACEHOLDER.matcher(message);
        while (matcher.find()) {
            placeholders.add(Integer.parseInt(matcher.group(1)));
        }
        return placeholders;
    }

    private static String formatJahiaWay(String message, TreeSet<Integer> placeholders) {
        Object[] arguments = new Object[placeholders.last() + 1];
        for (int i = 0; i < arguments.length; i++) {
            arguments[i] = "ARGUMENT-" + i;
        }
        String formatted;
        try {
            formatted = Messages.format(message, Locale.ENGLISH, arguments);
        } catch (IllegalArgumentException e) {
            return e.getMessage();
        }
        for (int placeholder : placeholders) {
            if (!formatted.contains("ARGUMENT-" + placeholder)) {
                return "lost {" + placeholder + "} in \"" + formatted + "\"";
            }
        }
        return null;
    }
}
