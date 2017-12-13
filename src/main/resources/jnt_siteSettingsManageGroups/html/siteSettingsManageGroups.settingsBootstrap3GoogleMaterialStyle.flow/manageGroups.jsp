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
<%--@elvariable id="flowExecutionUrl" type="java.lang.String"--%>
<%--@elvariable id="searchCriteria" type="org.jahia.services.usermanager.SearchCriteria"--%>

<template:addResources type="javascript" resources="jquery.min.js,jquery-ui.min.js,jquery.blockUI.js,workInProgress.js"/>
<template:addResources type="css" resources="jquery-ui.smoothness.css,jquery-ui.smoothness-jahia.css"/>

<template:addResources type="javascript" resources="datatables/jquery.dataTables.js,i18n/jquery.dataTables-${currentResource.locale}.js,datatables/dataTables.bootstrap-ext.js,settings/dataTables.initializer.js"/>
<template:addResources type="css" resources="datatables/css/bootstrap-theme.css,tablecloth.css"/>

<fmt:message key="label.workInProgressTitle" var="i18nWaiting"/><c:set var="i18nWaiting" value="${functions:escapeJavaScript(i18nWaiting)}"/>

<c:set var="groupCount" value="${fn:length(groups)}"/>
<c:set var="groupsFound" value="${groupCount > 0}"/>

<template:addResources>
<script type="text/javascript">
function submitGroupForm(act, group) {
	$('#groupFormAction').val(act);
	$('#groupFormSelected').val(encodeURIComponent(group));
	$('#groupForm').submit();
}
</script>
<c:if test="${groupsFound}">
    <script type="text/javascript">
        var oldStart = 0;
        function fnDrawCallback (o) {
            // auto scroll to top on paginate
            if ( o._iDisplayStart != oldStart ) {
                var targetOffset = $('#manageGroups').offset().top;
                $('html,body').animate({scrollTop: targetOffset}, 350);
                oldStart = o._iDisplayStart;
            }
        }

        $(document).ready(function () {
            dataTablesSettings.init('manageGroups', 25, [], null, fnDrawCallback);
        });
    </script>
</c:if>
</template:addResources>

<div class="page-header">
    <c:set var="mainNode" value="${renderContext.mainResource.node}"/>
    <c:choose>
        <c:when test="${fn:startsWith(mainNode.path, '/sites/')}">
            <h2><fmt:message key="siteSettings.label.manageGroups"/> - ${fn:escapeXml(mainNode.displayableName)}</h2>
        </c:when>
        <c:otherwise>
            <h2><fmt:message key="siteSettings.label.manageGroups.global"/></h2>
        </c:otherwise>
    </c:choose>
    <c:set var="multipleProvidersAvailable" value="${fn:length(providers) > 1}"/>
</div>

<c:forEach items="${flowRequestContext.messageContext.allMessages}" var="message">
    <c:if test="${message.severity eq 'INFO'}">
        <div class="alert alert-success">
            <button type="button" class="close" data-dismiss="alert">&times;</button>
                ${message.text}
        </div>
    </c:if>
    <c:if test="${message.severity eq 'ERROR'}">
        <div class="alert alert-danger">
            <button type="button" class="close" data-dismiss="alert">&times;</button>
                ${message.text}
        </div>
    </c:if>
</c:forEach>

<div class="panel panel-default">
    <div class="panel-body">
        <div class="alert alert-info">
            <button type="button" class="close" data-dismiss="alert">&times;</button>
            <fmt:message key="siteSettings.groups.found">
                <fmt:param value="${groupCount}"/>
            </fmt:message>
        </div>

        <form action="${flowExecutionUrl}" method="POST" style="display: inline;">
            <button class="btn btn-default" type="submit" name="_eventId_createGroup">
                <fmt:message key="siteSettings.groups.create"/>
            </button>
        </form>

        <c:if test="${groupsFound}">
            <form action="${flowExecutionUrl}" method="post" style="display: inline;" id="groupForm">
                <input type="hidden" name="selectedGroup" id="groupFormSelected"/>
                <input type="hidden" id="groupFormAction" name="_eventId" value="" />
            </form>
        </c:if>
        <table class="table table-bordered table-striped table-hover" id="manageGroups">
            <thead>
                <tr>
                    <th width="4%">#</th>
                    <th><fmt:message key="label.name"/></th>
                    <c:if test="${multipleProvidersAvailable}">
                        <th width="11%"><fmt:message key="column.provider.label"/></th>
                    </c:if>
                    <th width="20%"><fmt:message key="label.actions"/></th>
                </tr>
            </thead>
            <tbody>
            <c:choose>
                    <%--@elvariable id="groups" type="java.util.List"--%>
                    <c:when test="${!groupsFound}">
                        <tr>
                            <td colspan="${multipleProvidersAvailable ? '4' : '3'}"><fmt:message key="label.noItemFound"/></td>
                            <td style="display: none"></td>
                            <td style="display: none"></td>
                        </tr>
                    </c:when>
                    <c:otherwise>
                        <fmt:message var="i18nEdit" key="label.edit"/><c:set var="i18nEdit" value="${fn:escapeXml(i18nEdit)}"/>
                        <fmt:message var="i18nCopy" key="label.copy"/><c:set var="i18nCopy" value="${fn:escapeXml(i18nCopy)}"/>
                        <fmt:message var="i18nRemove" key="label.remove"/><c:set var="i18nRemove" value="${fn:escapeXml(i18nRemove)}"/>
                        <fmt:message var="i18nAddMembers" key="siteSettings.groups.addMembers"/><c:set var="i18nAddMembers" value="${fn:escapeXml(i18nAddMembers)}"/>
                        <fmt:message var="i18nRemoveNote" key="siteSettings.groups.remove.confirm"/>
                        <fmt:message var="i18nContinue" key="label.confirmContinue"/>
                        <c:set var="i18nRemoveConfirm" value="${functions:escapeJavaScript(i18nRemoveNote)} ${functions:escapeJavaScript(i18nContinue)}"/>
                        <c:forEach items="${groups}" var="grp" varStatus="loopStatus">
                            <c:set var="escapedGroupKey" value="${fn:escapeXml(functions:escapeJavaScript(grp.groupKey))}"/>
                            <tr>
                                <td>${loopStatus.count}</td>
                                <td>
                                    <a title="${i18nEdit}" href="#edit" onclick="submitGroupForm('editGroup', '${escapedGroupKey}'); return false;">${fn:escapeXml(user:displayName(grp))}</a>
                                </td>
                                <c:if test="${multipleProvidersAvailable}">
                                    <fmt:message var="i18nProviderLabel" key="providers.${grp.providerName}.label"/>
                                    <td>${fn:escapeXml(fn:contains(i18nProviderLabel, '???') ? grp.providerName : i18nProviderLabel)}</td>
                                </c:if>
                                <td>
                                    <a class="btn btn-fab btn-fab-xs btn-default" title="${i18nEdit}" href="#edit" onclick="submitGroupForm('editGroup', '${escapedGroupKey}'); return false;">
                                        <i class="material-icons">edit</i>
                                </a>
                                    <c:if test="${!grp.properties['j:external'].boolean}">
                                        <a style="margin-bottom:0;" class="btn btn-fab btn-fab-xs btn-default" title="${i18nAddMembers}" href="#addMembers"
                                           onclick="submitGroupForm('editGroupMembers', '${escapedGroupKey}'); return false;">
                                            <i class="material-icons">people</i>
                                        </a>
                                        <a class="btn btn-fab btn-fab-xs btn-default" title="${i18nCopy}" href="#copy" onclick="submitGroupForm('copyGroup', '${grp.groupKey}'); return false;">
                                            <i class="material-icons">content_copy</i>
                                        </a>
                                    </c:if>
                                    <c:if test="${!grp.properties['j:external'].boolean && !functions:contains(systemGroups, grp.groupKey)}">
                                        <a class="btn btn-fab btn-fab-xs btn-danger" title="${i18nRemove}" href="#delete" onclick="if (confirm('${i18nRemoveConfirm}')) { workInProgress('${i18nWaiting}'); submitGroupForm('removeGroup', '${escapedGroupKey}');} return false;">
                                            <i class="material-icons">delete</i>
                                        </a>
                                    </c:if>
                                </td>
                            </tr>
                        </c:forEach>
                    </c:otherwise>
                </c:choose>
            </tbody>
        </table>
    </div>
</div>
