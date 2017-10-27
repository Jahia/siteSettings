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
<template:addResources type="javascript" resources="jquery.min.js,jquery-ui.min.js,jquery.blockUI.js,workInProgress.js"/>
<fmt:message key="label.workInProgressTitle" var="i18nWaiting"/><c:set var="i18nWaiting" value="${functions:escapeJavaScript(i18nWaiting)}"/>
<c:set var="readOnlyProperties" value="${userProperties.readOnlyProperties}"/>

<div class="page-header">
    <h2><fmt:message key="label.edit"/>&nbsp;${userProperties.displayName}</h2>
</div>

<c:forEach items="${flowRequestContext.messageContext.allMessages}" var="message">
    <c:if test="${message.severity eq 'ERROR'}">
        <div class="alert alert-danger">
            <button type="button" class="close" data-dismiss="alert">&times;</button>
                ${message.text}
        </div>
    </c:if>
</c:forEach>

<div class="row">
    <div class="col-md-offset-2 col-md-8">
        <div class="panel panel-default">
            <div class="panel-body">
                <form action="${flowExecutionUrl}" method="post" id="editUser" autocomplete="off">
                    <fieldset title="<fmt:message key='siteSettings.user.profile'/>">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group form-group-sm label-floating">
                                    <label class="control-label" for="firstName"><fmt:message key="label.firstName"/></label>
                                    <input class="form-control" type="text" name="firstName" id="firstName" value="${userProperties.firstName}"${functions:contains(readOnlyProperties, 'j:firstName') ? ' disabled="disabled"' : ''}>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group form-group-sm label-floating">
                                    <label class="control-label" for="lastName"><fmt:message key="label.lastName"/></label>
                                    <input class="form-control" type="text" name="lastName" id="lastName" value="${userProperties.lastName}"${functions:contains(readOnlyProperties, 'j:lastName') ? ' disabled="disabled"' : ''}>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group form-group-sm label-floating">
                                    <label class="control-label" for="email"><fmt:message key="label.email"/></label>
                                    <input class="form-control" type="text" name="email" id="email" value="${userProperties.email}"${functions:contains(readOnlyProperties, 'j:email') ? ' disabled="disabled"' : ''}>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group form-group-sm label-floating">
                                    <label class="control-label" for="organization"><fmt:message key="label.organization"/></label>
                                    <input class="form-control" type="text" name="organization" id="organization" value="${userProperties.organization}"${functions:contains(readOnlyProperties, 'j:organization') ? ' disabled="disabled"' : ''}>
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset title="<fmt:message key='siteSettings.user.password'/>">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group form-group-sm label-floating">
                                    <label class="control-label" for="password"><fmt:message key="label.password"/></label>
                                    <input class="form-control" type="password" name="password" id="password" value=""${userProperties.readOnly or userProperties.external ? ' disabled="disabled"' : ''} autocomplete="off">
                                    <div style="margin-bottom:15px;" class="text-info">&nbsp;(<fmt:message key="siteSettings.user.edit.password.no.change"/>)</div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group form-group-sm label-floating">
                                    <label class="control-label" for="passwordConfirm"><fmt:message key="label.confirmPassword"/></label>
                                    <input class="form-control" type="password" name="passwordConfirm" id="passwordConfirm" value=""${userProperties.readOnly or userProperties.external ? ' disabled="disabled"' : ''} autocomplete="off">
                                    <div style="margin-bottom:15px;" class="text-info">&nbsp;(<fmt:message key="siteSettings.user.edit.password.no.change"/>)</div>
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset title="<fmt:message key='label.options'/>">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group form-group-sm">
                                    <div class="checkbox">
                                        <label for="emailNotificationsDisabled">
                                            <input type="checkbox" name="emailNotificationsDisabled" id="emailNotificationsDisabled"
                                                   <c:if test="${userProperties.emailNotificationsDisabled}">checked="checked"</c:if>
                                            ${functions:contains(readOnlyProperties, 'emailNotificationsDisabled') ? ' disabled="disabled"' : ''}>
                                            <fmt:message key="siteSettings.user.emailNotifications"/>
                                            <input type="hidden" name="_emailNotificationsDisabled"/>
                                        </label>
                                    </div>

                                    <div class="checkbox">
                                        <label for="accountLocked">
                                            <input type="checkbox" name="accountLocked" id="accountLocked"
                                                   <c:if test="${userProperties.accountLocked}">checked="checked"</c:if>
                                            ${functions:contains(readOnlyProperties, 'j:accountLocked') ? ' disabled="disabled"' : ''}>
                                            <fmt:message key="label.accountLocked"/>
                                            <input type="hidden" name="_accountLocked"/>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group form-group-sm label-floating">
                                    <label class="control-label" for="preferredLanguage"><fmt:message key="siteSettings.user.preferredLanguage"/></label>
                                    <select class="form-control" id="preferredLanguage" name="preferredLanguage"${functions:contains(readOnlyProperties, 'preferredLanguage') ? ' disabled="disabled"' : ''}>
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
                        <div class="row">
                            <div class="col-md-12">
                                <div class="form-group">
                                    <label class="col-md-2 control-label" for="groupsFields"><fmt:message key="siteSettings.user.groups.list"/></label>
                                    <div class="col-md-10">
                                        <select class="form-control fontfix" name="selectMember" size="6" multiple>
                                            <c:forEach items="${userGroups}" var="group">
                                                <option value="${user:formatUserValueOption(group)}">${user:formatUserTextOption(group, 'Name, 20;SiteTitle, 15;Properties, 20')}</option>
                                            </c:forEach>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <div class="row">
                            <div class="col-md-12">
                                <button class="btn btn-default btn-sm" type="submit" name="_eventId_cancel">
                                    <i class="material-icons">cancel</i>
                                    <fmt:message key='label.cancel'/>
                                </button>
                                <c:if test="${!userProperties.readOnly && !userProperties.external}">
                                    <button class="btn btn-danger btn-sm" type="submit" name="_eventId_removeUser">
                                        <i class="material-icons">delete</i>
                                        <fmt:message key='siteSettings.user.remove'/>
                                    </button>
                                </c:if>
                                <button class="btn btn-primary btn-sm pull-right" type="submit" name="_eventId_update" onclick="workInProgress('${i18nWaiting}'); return true;">
                                    <i class="material-icons">update</i>
                                    <fmt:message key='label.update'/>
                                </button>
                            </div>
                        </div>
                    </fieldset>
                </form>
            </div>
        </div>
    </div>
</div>
