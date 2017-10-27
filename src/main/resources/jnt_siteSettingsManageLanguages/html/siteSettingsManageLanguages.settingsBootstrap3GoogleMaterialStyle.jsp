<%@ page import="org.jahia.services.content.decorator.JCRSiteNode,
                 org.jahia.services.render.Resource" %>
<%@ page import="org.jahia.utils.LanguageCodeConverters" %>
<%@ page import="java.util.Comparator" %>
<%@ page import="java.util.Locale" %>
<%@ page import="java.util.Set" %>
<%@ page import="java.util.TreeSet" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="functions" uri="http://www.jahia.org/tags/functions" %>
<%@ taglib prefix="jcr" uri="http://www.jahia.org/tags/jcr" %>
<%@ taglib prefix="s" uri="http://www.jahia.org/tags/search" %>
<%@ taglib prefix="template" uri="http://www.jahia.org/tags/templateLib" %>
<%--@elvariable id="currentNode" type="org.jahia.services.content.JCRNodeWrapper"--%>
<%--@elvariable id="out" type="java.io.PrintWriter"--%>
<%--@elvariable id="script" type="org.jahia.services.render.scripting.Script"--%>
<%--@elvariable id="scriptInfo" type="java.lang.String"--%>
<%--@elvariable id="workspace" type="java.lang.String"--%>
<%--@elvariable id="renderContext" type="org.jahia.services.render.RenderContext"--%>
<%--@elvariable id="currentResource" type="org.jahia.services.render.Resource"--%>
<%--@elvariable id="url" type="org.jahia.services.render.URLGenerator"--%>
<%--@elvariable id="mailSettings" type="org.jahia.services.mail.MailSettings"--%>
<%--@elvariable id="flowRequestContext" type="org.springframework.webflow.execution.RequestContext"--%>
<%--@elvariable id="flowExecutionUrl" type="java.lang.String"--%>

<c:set var="site" value="${renderContext.mainResource.node.resolveSite}"/>
<c:set var="uiLocale" value="${renderContext.UILocale}"/>
<template:addResources type="javascript" resources="settings/angular.min.js"/>
<template:addResources type="javascript" resources="settings/apps/languages.js"/>

<%
    JCRSiteNode site = (JCRSiteNode) pageContext.getAttribute("site");
    Resource r = (Resource) request.getAttribute("currentResource");
    final Locale currentLocale = (Locale) pageContext.getAttribute("uiLocale");
    Set<Locale> siteLocales = new TreeSet<Locale>(new Comparator<Locale>() {
        public int compare(Locale o1, Locale o2) {
            return o1.getDisplayName(currentLocale).compareTo(o2.getDisplayName(currentLocale));
        }
    });
    siteLocales.addAll(site.getLanguagesAsLocales());
    siteLocales.addAll(site.getInactiveLanguagesAsLocales());

    request.setAttribute("siteLocales", siteLocales);
    request.setAttribute("availableLocales", LanguageCodeConverters.getSortedLocaleList(currentLocale));
%>

<script type="text/javascript">
    var mandatoryLanguages = [];
    var activeDefaultLanguages = [];
    var activeLiveLanguages = [];
    var siteLocales = [];
    var availableLocales = [];

    <c:forEach items="${site.mandatoryLanguages}" var="mandatoryLanguage">
    mandatoryLanguages.push("${mandatoryLanguage}");
    </c:forEach>
    <c:forEach items="${site.languages}" var="language">
    activeDefaultLanguages.push("${language}");
    </c:forEach>
    <c:forEach items="${site.activeLiveLanguages}" var="liveLanguage">
    activeLiveLanguages.push("${liveLanguage}");
    </c:forEach>
    <c:forEach items="${availableLocales}" var="availableLocale">
    availableLocales.push({"locale" : "${availableLocale}", "displayLocale" : "<%= ((Locale) pageContext.getAttribute("availableLocale")).getDisplayName(currentLocale)%> (${availableLocale})"});
    </c:forEach>
    <c:forEach items="${siteLocales}" var="siteLocale">
    siteLocales.push({"locale" : "${siteLocale}", "displayLocale" : "<%= ((Locale) pageContext.getAttribute("siteLocale")).getDisplayName(currentLocale)%> (${siteLocale})"});
    </c:forEach>

    angular.module('siteSetting').constant("languagesConstants", {
        "currentLocale" : "${renderContext.mainResourceLocale}",
        "siteRestUrl" : "${url.context}/modules/api/jcr/v1/default/${currentResource.locale}/nodes/${renderContext.mainResource.node.resolveSite.identifier}",
        "siteUrl" : "<c:url value='${url.base}${renderContext.mainResource.node.resolveSite.path}'/>",
        "siteDefaultLanguage" : "${site.defaultLanguage}",
        "mandatoryLanguages" : mandatoryLanguages,
        "activeDefaultLanguages" : activeDefaultLanguages,
        "activeLiveLanguages" : activeLiveLanguages,
        "siteLocales" : siteLocales,
        "availableLocales" : availableLocales,
        "mixLanguages" : ${site.mixLanguagesActive},
        "allowsUnlistedLanguages" : ${site.allowsUnlistedLanguages}
    });
</script>

<div class="page-header">
    <h2><fmt:message key="siteSettings.label.manageLanguages"/> - ${fn:escapeXml(site.displayableName)}</h2>
</div>

<div ng-app="siteSetting">
    <div ng-controller="languages">

        <div class="loading" ng-show="displayLoading">
            <div class="alert alert-info">
                <strong><fmt:message key="label.workInProgressTitle"/></strong>
            </div>
        </div>

        <div>
            <div class="row">
                <div class="col-md-12">
                    <h3 class="text-left"><fmt:message key="siteSettings.locale.availableLanguages"/></h3>
                </div>
            </div>
            <div class="row">
                <div class="col-md-4">
                    <select ng-model="newLanguages" name="language_list" id="language_list" multiple="multiple" size="${fn:length(siteLocales) > 20 ? fn:length(siteLocales):20}">
                        <option ng-repeat="availableLocale in site.availableLocales | filter:filterSiteLocales" ng-value="availableLocale">{{availableLocale.displayLocale}}</option>
                    </select>
                    <button class="btn btn-fab btn-fab-mini btn-primary" type="button" ng-click="addLanguage()" ng-disabled="!newLanguages || newLanguages.length == 0"><i class="material-icons">fast_forward</i></button>
                </div>
                <div class="col-md-7">
                    <table class="table table-bordered table-striped table-hover">
                        <thead>
                        <tr>
                            <th><fmt:message key="siteSettings.label.language"/></th>
                            <th><fmt:message key="siteSettings.label.language.default"/></th>
                            <th><fmt:message key="siteSettings.label.language.mandatory"/></th>
                            <th><fmt:message key="siteSettings.label.language.active.edit"/></th>
                            <th><fmt:message key="siteSettings.label.language.active.live"/></th>
                            <th><fmt:message key="label.actions"/></th>
                        </tr>
                        </thead>
                        <tbody id="siteLanguagesBody">
                        <tr ng-repeat="siteLocale in site.siteLocales track by $index">
                            <td>{{siteLocale.displayLocale}}</td>
                            <td>
                                <div class="radio">
                                    <label>
                                        <input type="radio" name="j:defaultLanguage" ng-model="site.siteDefaultLanguage" ng-value="siteLocale.locale"/>
                                    </label>
                                </div>
                            </td>
                            <td>
                                <div class="checkbox">
                                    <label>
                                        <input type="checkbox" ng-model="siteLocale.mandatory"/>
                                    </label>
                                </div>
                            </td>
                            <td>
                                <div class="checkbox">
                                    <label>
                                        <input type="checkbox" ng-model="siteLocale.activeEdit" ng-disabled="isEditDisabled(siteLocale)"/>
                                    </label>
                                </div>
                            </td>
                            <td>
                                <div class="checkbox">
                                    <label>
                                        <input type="checkbox" ng-model="siteLocale.activeLive" ng-disabled="isLiveDisabled(siteLocale)"/>
                                    </label>
                                </div>
                            </td>
                            <td>
                                <button ng-show="canBeDeleted(siteLocale)" class="btn btn-fab btn-fab-mini btn-danger" type="button" ng-click="delete($index)">
                                    <i class="material-icons">delete</i>
                                </button>
                                <div ng-if="!canBeDeleted(siteLocale)">
                                    <span ng-show="getNotDeletableReason(siteLocale) === 'current'"><fmt:message  key="siteSettings.label.language.delete.current"/></span>
                                    <span ng-show="getNotDeletableReason(siteLocale) === 'default'"><fmt:message  key="siteSettings.label.language.delete.default"/></span>
                                    <span ng-show="getNotDeletableReason(siteLocale) === 'active'"><fmt:message  key="siteSettings.label.language.delete.active"/></span>
                                    <span ng-show="getNotDeletableReason(siteLocale) === 'contents'"><fmt:message  key="siteSettings.label.language.delete.contents"/></span>
                                </div>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="row">
                <div class="col-md-12">
                    <div class="checkbox">
                        <label for="mixLanguages">
                            <input type="checkbox" ng-model="site.mixLanguages" id="mixLanguages" />
                            <fmt:message key="siteSettings.locale.mixLanguages"/>
                        </label>
                    </div>
                    <div class="checkbox">
                        <label for="allowsUnlistedLanguages">
                            <input type="checkbox" ng-model="site.allowsUnlistedLanguages" id="allowsUnlistedLanguages" />
                            <fmt:message key="siteSettings.locale.allowsUnlistedLanguages"/>
                        </label>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-12">
                    <p class="text-center">
                        <button class="btn btn-primary btn-sm pull-right" type="button" id="updateSite_button" ng-click="save()">
                            <i class="material-icons">add</i>
                            <fmt:message key="label.submit"/></button>
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>