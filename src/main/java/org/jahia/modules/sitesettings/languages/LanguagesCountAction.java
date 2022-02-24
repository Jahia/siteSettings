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
package org.jahia.modules.sitesettings.languages;

import org.apache.commons.lang.StringUtils;
import org.jahia.bin.Action;
import org.jahia.bin.ActionResult;
import org.jahia.services.content.JCRContentUtils;
import org.jahia.services.content.JCRSessionWrapper;
import org.jahia.services.render.RenderContext;
import org.jahia.services.render.Resource;
import org.jahia.services.render.URLResolver;
import org.json.JSONObject;

import javax.jcr.query.Query;
import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

/**
 * Action that return the count of nodes for a given locale
 *
 * @author Kevan
 */
public class LanguagesCountAction extends Action {

    @Override
    public ActionResult doExecute(HttpServletRequest httpServletRequest, RenderContext renderContext, Resource resource, JCRSessionWrapper jcrSessionWrapper, Map<String, List<String>> parameters, URLResolver urlResolver) throws Exception {
        String locale = getParameter(parameters, "locale");

        if (StringUtils.isEmpty(locale)) {
            throw new IllegalArgumentException("Missing locale parameter");
        }

        JSONObject result = new JSONObject();
        result.put("count", jcrSessionWrapper.getWorkspace().getQueryManager()
                .createQuery("SELECT count AS [rep:count(skipChecks=1)] FROM [jnt:translation] WHERE isdescendantnode(['" + renderContext.getMainResource().getNode().getPath() + "']) and [jcr:language] = '" + JCRContentUtils.sqlEncode(locale) + "'", Query.JCR_SQL2)
                .execute().getRows().nextRow().getValue("count").getLong());


        return new ActionResult(200, null, result);
    }
}
