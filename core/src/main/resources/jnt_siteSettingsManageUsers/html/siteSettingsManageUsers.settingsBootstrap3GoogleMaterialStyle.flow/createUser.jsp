<%--@elvariable id="userProperties" type="org.jahia.modules.sitesettings.users.management.UserProperties"--%>
<%@ page language="java" contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="template" uri="http://www.jahia.org/tags/templateLib" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="jcr" uri="http://www.jahia.org/tags/jcr" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="functions" uri="http://www.jahia.org/tags/functions" %>
<%@ taglib prefix="form" uri="http://www.springframework.org/tags/form" %>
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

<div class="page-header">
    <h2><fmt:message key="siteSettings.user.create"/></h2>
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
                <p><fmt:message key="label.noteThat"/>:&nbsp;<fmt:message key="siteSettings.user.errors.username.syntax"/></p>

                <form action="${flowExecutionUrl}" method="post" autocomplete="off">
                    <fieldset title="<fmt:message key="siteSettings.user.profile"/>">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="form-group label-floating">
                                    <label class="control-label" for="username">
                                        <fmt:message key="label.username"/><strong class="text-danger">*</strong>
                                    </label>
                                    <input type="text" name="username" class="form-control" id="username" value="${userProperties.username}">
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group label-floating">
                                    <label class="control-label" for="firstName"><fmt:message key="label.firstName"/></label>
                                    <input type="text" name="firstName" class="form-control" id="firstName" value="${userProperties.firstName}">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group label-floating">
                                    <label class="control-label" for="lastName"><fmt:message key="label.lastName"/></label>
                                    <input type="text" name="lastName" class="form-control" id="lastName" value="${userProperties.lastName}">
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group label-floating">
                                    <label class="control-label" for="email"><fmt:message key="label.email"/></label>
                                    <input type="text" name="email" class="form-control" id="email" value="${userProperties.email}">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group label-floating">
                                    <label class="control-label" for="organization"><fmt:message key="label.organization"/></label>
                                    <input type="text" name="organization" class="form-control" id="organization" value="${userProperties.organization}">
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group label-floating">
                                    <label class="control-label" for="password"><fmt:message key="label.password"/><strong class="text-danger">*</strong></label>
                                    <input type="password" name="password" class="form-control" id="password" value="" autocomplete="off">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group label-floating">
                                    <label class="control-label" for="passwordConfirm"><fmt:message key="label.confirmPassword"/><strong class="text-danger">*</strong></label>
                                    <input type="password" name="passwordConfirm" class="form-control" id="passwordConfirm" value="" autocomplete="off">
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset title="<fmt:message key='label.options'/>">
                        <div class="container-fluid">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <div class="checkbox">
                                            <label for="emailNotificationsDisabled">
                                                <input type="checkbox" name="emailNotificationsDisabled" id="emailNotificationsDisabled" <c:if test="${userProperties.emailNotificationsDisabled}">checked="checked"</c:if>>
                                                <fmt:message key="siteSettings.user.emailNotifications"/>
                                            </label>
                                        </div>
                                        <div class="checkbox">
                                            <label for="accountLocked">
                                                <input type="checkbox" name="accountLocked" id="accountLocked" <c:if test="${userProperties.accountLocked}">checked="checked"</c:if>>
                                                <fmt:message key="label.accountLocked"/>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group label-floating">
                                        <label class="control-label" for="preferredLanguage"><fmt:message key="siteSettings.user.preferredLanguage"/></label>
                                        <select class="form-control" id="preferredLanguage" name="preferredLanguage">
                                            <c:forEach items="${functions:availableAdminBundleLocale(renderContext.UILocale)}" var="uiLanguage">
                                                <option value="${uiLanguage}" <c:if test="${uiLanguage eq userProperties.preferredLanguage}">selected="selected" </c:if>>${functions:displayLocaleNameWith(uiLanguage, renderContext.UILocale)}</option>
                                            </c:forEach>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    <div class="form-group form-group-sm">
                        <button class="btn btn-raised btn-primary pull-right"
                                type="submit" name="_eventId_add" onclick="workInProgress('${i18nWaiting}'); return true;">
                            <fmt:message key='label.add'/>
                        </button>
                        <button class="btn btn-default pull-right" type="submit" name="_eventId_cancel">
                            <fmt:message key='label.cancel'/>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
