/*
 * Copyright (C) 2002-2022 Jahia Solutions Group SA. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.jahia.modules.sitesettings.users.management;

import java.io.Serializable;

import org.jahia.utils.i18n.Messages;
import org.springframework.binding.message.MessageBuilder;
import org.springframework.binding.validation.ValidationContext;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author rincevent
 */
public class CsvFile implements Serializable {
    private static final long serialVersionUID = 2592011306396271299L;
    private String csvSeparator;
    private MultipartFile csvFile;

    public String getCsvSeparator() {
        return csvSeparator;
    }

    public void setCsvSeparator(String csvSeparator) {
        this.csvSeparator = csvSeparator;
    }

    public MultipartFile getCsvFile() {
        return csvFile;
    }

    public void setCsvFile(MultipartFile csvFile) {
        this.csvFile = csvFile;
    }

    public void validateBulkCreateUser(ValidationContext context) {
        if (csvFile == null || csvFile.isEmpty()) {
            context.getMessageContext().addMessage(new MessageBuilder().error().source("csvFile")
                    .defaultText(Messages.get("resources.JahiaSiteSettings", "siteSettings.users.bulk.errors.missing.import", LocaleContextHolder.getLocale())).build());
        }
    }
}
