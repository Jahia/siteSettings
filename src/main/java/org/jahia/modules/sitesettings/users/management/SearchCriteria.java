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

/**
 * @author rincevent
 */
public class SearchCriteria implements Serializable {
    private static final long serialVersionUID = 6922751122839696683L;
    
    private String searchString;
    private String searchIn;
    private String[] properties;
    private String storedOn;
    private String[] providers;
    private int numberOfRemovedJahiaAdministrators = 0;

    public String[] getProperties() {
        return properties;
    }

    public void setProperties(String[] properties) {
        this.properties = properties;
    }

    public String[] getProviders() {
        return providers;
    }

    public void setProviders(String[] providers) {
        this.providers = providers;
    }

    public String getSearchIn() {
        return searchIn;
    }

    public void setSearchIn(String searchIn) {
        this.searchIn = searchIn;
    }

    public String getSearchString() {
        return searchString;
    }

    public void setSearchString(String searchString) {
        this.searchString = searchString;
    }

    public String getStoredOn() {
        return storedOn;
    }

    public void setStoredOn(String storedOn) {
        this.storedOn = storedOn;
    }

    public void setNumberOfRemovedJahiaAdministrators(int numberOfRemovedJahiaAdministrators) {
        this.numberOfRemovedJahiaAdministrators = numberOfRemovedJahiaAdministrators;
    }

    public int getNumberOfRemovedJahiaAdministrators() {
        return numberOfRemovedJahiaAdministrators;
    }
}
