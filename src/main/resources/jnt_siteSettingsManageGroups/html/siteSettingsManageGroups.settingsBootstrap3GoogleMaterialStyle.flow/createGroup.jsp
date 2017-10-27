<%@ page language="java" contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="template" uri="http://www.jahia.org/tags/templateLib" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="jcr" uri="http://www.jahia.org/tags/jcr" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="functions" uri="http://www.jahia.org/tags/functions" %>
<%@ taglib prefix="form" uri="http://www.springframework.org/tags/form" %>
<%--@elvariable id="flowRequestContext" type="org.springframework.webflow.execution.RequestContext"--%>
<template:addResources type="javascript" resources="jquery.min.js,jquery-ui.min.js,jquery.blockUI.js,workInProgress.js"/>
<template:addResources type="css" resources="jquery-ui.smoothness.css,jquery-ui.smoothness-jahia.css"/>
<fmt:message key="label.workInProgressTitle" var="i18nWaiting"/><c:set var="i18nWaiting" value="${functions:escapeJavaScript(i18nWaiting)}"/>
<template:addResources>
    <script type="text/javascript">
        $(document).ready(function() {
            $('#groupname').focus();
        });
    </script>
</template:addResources>

<div class="page-header">
    <h2><fmt:message key="${copyMode ? 'siteSettings.groups.copy' : 'siteSettings.groups.create'}"/></h2>
</div>

<c:forEach items="${flowRequestContext.messageContext.allMessages}" var="message">
    <c:if test="${message.severity eq 'ERROR'}">
        <div class="alert alert-error">
            <button type="button" class="close" data-dismiss="alert">&times;</button>
                ${message.text}
        </div>
    </c:if>
</c:forEach>

<div class="row">
    <div class="col-md-offset-3 col-md-6">
        <div class="panel panel-default">
            <div class="panel-body">
                <dl>
                    <dt><fmt:message key="label.noteThat"/></dt>
                    <dd>
                        <ul>
                            <li><fmt:message key="siteSettings.groups.errors.groupname.unique"/></li>
                            <li><fmt:message key="siteSettings.groups.errors.groupname.syntax"/></li>
                        </ul>
                    </dd>
                </dl>

                <form action="${flowExecutionUrl}" method="post" autocomplete="off">
                    <div class="form-group form-group-sm label-floating">
                        <c:choose>
                            <c:when test="${copyMode && empty group.groupname}"><c:set var="groupnameValue" value="${groupToCopy.groupname}-2"/></c:when>
                            <c:otherwise><c:set var="groupnameValue" value="${group.groupname}"/></c:otherwise>
                        </c:choose>
                        <label class="control-label" for="groupname">
                            <fmt:message key="label.name"/><strong class="text-danger">*</strong>
                        </label>
                        <input class="form-control" type="text" name="groupname" id="groupname" value="${fn:escapeXml(groupnameValue)}"/>
                    </div>

                    <div class="container-fluid">
                        <button class="btn btn-default btn-sm" type="submit" name="_eventId_cancel">
                            <i class="material-icons">cancel</i>
                            <fmt:message key="label.cancel"/>
                        </button>
                        <button class="btn btn-primary btn-sm pull-right" type="submit"
                                name="_eventId_${copyMode ? 'copy' : 'add'}"
                                onclick="workInProgress('${i18nWaiting}'); return true;">
                            <i class="material-icons">${copyMode ? 'content_copy' : 'add'}</i>
                            <fmt:message key="label.${copyMode ? 'copy' : 'add'}"/>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
