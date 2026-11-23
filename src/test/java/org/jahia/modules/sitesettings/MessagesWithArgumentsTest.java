package org.jahia.modules.sitesettings;

import org.junit.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.Assert.assertTrue;

/**
 * Each message of the module that takes arguments formats as Jahia formats it.
 * <p>
 * {@code org.jahia.utils.i18n.Messages.format} doubles every single quote before it hands a message with arguments
 * to {@link MessageFormat}, so a quote cannot escape a brace there, and a literal brace fails the whole call.
 */
public class MessagesWithArgumentsTest {

    private static final Path BUNDLES = Paths.get("src", "main", "resources", "resources");
    private static final Pattern ARGUMENT = Pattern.compile("\\{(\\d+)}");

    @Test
    public void everyMessageWithArgumentsFormatsAndKeepsItsArguments() throws IOException {
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
                    if (placeholders.isEmpty()) {
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
        assertTrue("no message with arguments found under " + BUNDLES.toAbsolutePath(), checked > 0);
        assertTrue(String.join("\n", failures), failures.isEmpty());
    }

    private static TreeSet<Integer> placeholdersOf(String message) {
        TreeSet<Integer> placeholders = new TreeSet<>();
        Matcher matcher = ARGUMENT.matcher(message);
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
            formatted = MessageFormat.format(message.replace("'", "''"), arguments);
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
