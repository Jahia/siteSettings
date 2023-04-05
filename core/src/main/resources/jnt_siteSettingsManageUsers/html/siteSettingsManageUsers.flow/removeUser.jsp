<%--@elvariable id="userProperties" type="org.jahia.modules.sitesettings.users.management.UserProperties"--%>
<%@ page language="java" contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="template" uri="http://www.jahia.org/tags/templateLib" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="jcr" uri="http://www.jahia.org/tags/jcr" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="functions" uri="http://www.jahia.org/tags/functions" %>
<%@ taglib prefix="user" uri="http://www.jahia.org/tags/user" %>
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
<template:addResources type="javascript" resources="jquery.min.js,jquery-ui.min.js,jquery.blockUI.js,workInProgress.js,admin-bootstrap.js"/>
<template:addResources type="css" resources="jquery-ui.smoothness.css,jquery-ui.smoothness-jahia.css"/>
<fmt:message key="label.workInProgressTitle" var="i18nWaiting"/><c:set var="i18nWaiting" value="${functions:escapeJavaScript(i18nWaiting)}"/>
<div>
    <h2><fmt:message key="label.delete"/>&nbsp;${userProperties.displayName}</h2>
    <div class="alert alert-info">
        <c:if test="${!userProperties.readOnly}">
        <p><fmt:message key="siteSettings.user.definitivelyRemove"/><br/>
        <fmt:message key="siteSettings.user.definitivelyRemove.files"/></p>
        <a class="btn btn-primary" href="<c:url value='/cms/export/default${userProperties.localPath}.zip?cleanup=simple'/>" target="_blank">
            <i class="icon-upload icon-white"></i>
            <fmt:message key="label.export"/>
        </a>
        </c:if>
        <c:if test="${userProperties.readOnly}">
            <p><fmt:message key="siteSettings.user.definitivelyRemove.readOnly"/></p>
        </c:if>
    </div>
        <c:forEach items="${flowRequestContext.messageContext.allMessages}" var="message">
            <c:if test="${message.severity eq 'ERROR'}">
            <div class="alert alert-error">
                <button type="button" class="close" data-dismiss="alert">&times;</button>
                    ${message.text}
            </div>
            </c:if>
        </c:forEach>
    <div class="box-1">
        <form action="${flowExecutionUrl}" method="post" id="editUser">
            <fieldset title="<fmt:message key='siteSettings.user.profile'/>">
                <div class="container-fluid">
                    <div class="row-fluid">
                        <div class="span4">
                            <label for="firstName"><fmt:message key="label.firstName"/></label>
                            <input class="span12" type="text" name="firstName" id="firstName" value="${userProperties.firstName}" disabled="disabled">
                        </div>
                        <div class="span4">
                            <label for="lastName"><fmt:message key="label.lastName"/></label>
                            <input class="span12" type="text" name="lastName" id="lastName" value="${userProperties.lastName}" disabled="disabled">
                        </div>
                    </div>
                    <div class="row-fluid">
                        <div class="span4">
                            <label for="email"><fmt:message key="label.email"/></label>
                            <input class="span12" type="text" name="email" id="email" value="${userProperties.email}" disabled="disabled">
                        </div>
                        <div class="span4">
                            <label for="organization"><fmt:message key="label.organization"/></label>
                            <input class="span12" type="text" name="organization" id="organization" value="${userProperties.organization}" disabled="disabled">
                        </div>
                    </div>
                </div>
            </fieldset>
            <fieldset title="<fmt:message key='label.options'/>">
                <div class="container-fluid">
                    <div class="row-fluid">
                        <div class="span4">
                            <label for="emailNotificationsDisabled">
                                <input type="checkbox" name="emailNotificationsDisabled" id="emailNotificationsDisabled"
                                       <c:if test="${userProperties.emailNotificationsDisabled}">checked="checked"</c:if> disabled="disabled">
                                <fmt:message key="siteSettings.user.emailNotifications"/>
                            </label>
                            <label for="accountLocked">
                                <input type="checkbox" name="accountLocked" id="accountLocked"
                                       <c:if test="${userProperties.accountLocked}">checked="checked"</c:if> disabled="disabled">
                                <fmt:message key="label.accountLocked"/>
                            </label>
                        </div>
                        <div class="span4">
                            <label for="preferredLanguage"><fmt:message key="siteSettings.user.preferredLanguage"/></label>
                            <select class="span12" id="preferredLanguage" name="preferredLanguage" disabled="disabled">
                                <c:forEach items="${functions:availableAdminBundleLocale(renderContext.UILocale)}" var="uiLanguage">
                                    <option value="${uiLanguage}"
                                            <c:if test="${uiLanguage eq userProperties.preferredLanguage}">selected="selected" </c:if>>${functions:displayLocaleNameWith(uiLanguage, renderContext.UILocale)}</option>
                                </c:forEach>
                            </select>
                        </div>
                    </div>
                </div>
            </fieldset>
            <fieldset id="groupsFields" title="<fmt:message key="siteSettings.user.groups.list"/>">
                <div class="container-fluid">
                    <div class="row-fluid">
                        <div class="span12">
                            <label for="groupsFields"><fmt:message key="siteSettings.user.groups.list"/></label>
                            <select class="span4 fontfix" name="selectMember" size="6" multiple disabled="disabled">
                                <c:forEach items="${userGroups}" var="group">
                                    <option value="${user:formatUserValueOption(group)}">${user:formatUserTextOption(group, 'Name, 20;SiteTitle, 15;Properties, 20')}</option>
                                </c:forEach>
                            </select>
                        </div>
                    </div>
                </div>
            </fieldset>
            <fieldset>
                <div class="container-fluid">
                    <div class="row-fluid">
                        <div class="span12">
                            <c:if test="${!userProperties.readOnly}">
                                <button class="btn btn-danger" type="submit" name="_eventId_confirm" onclick="workInProgress('${i18nWaiting}'); return true;">
                                    <i class="icon-remove icon-white"></i>
                                    &nbsp;<fmt:message key="label.delete"/>
                                </button>
                            </c:if>
                            <button class="btn" type="submit" name="_eventId_cancel">
                                <i class="icon-ban-circle"></i>
                                &nbsp;<fmt:message key="label.cancel"/>
                            </button>
                        </div>
                    </div>
                </div>
            </fieldset>
        </form>
    </div>
</div>