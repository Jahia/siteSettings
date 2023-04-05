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

<c:set var="memberDisplayLimit" value="${functions:default(fn:escapeXml(displayLimit), siteSettingsProperties.memberDisplayLimit)}"/>

<template:addResources type="javascript" resources="jquery.min.js,jquery-ui.min.js,jquery.blockUI.js,workInProgress.js"/>
<template:addResources type="css" resources="jquery-ui.smoothness.css,jquery-ui.smoothness-jahia.css"/>
<fmt:message key="label.workInProgressTitle" var="i18nWaiting"/><c:set var="i18nWaiting" value="${functions:escapeJavaScript(i18nWaiting)}"/>

<fmt:message var="i18nRemoveMultipleConfirm" key="siteSettings.groups.removeMembers.confirm"/>
<fmt:message var="i18nContinue" key="label.confirmContinue"/>

<c:set var="isGroupEditable" value="${!group.properties['j:external'].boolean}"/>

<c:if test="${isGroupEditable}">
    <template:addResources>
        <script type="text/javascript">
            function removeGroupMember(confirmMsg, member) {
                if (confirm(confirmMsg)) {
                    $.each($(':checkbox[name=selectedMembers]'), function() {
                        this.checked=$(this).val() == member;
                    });
                    workInProgress('${i18nWaiting}');
                    return true;
                } else {
                    return false;
                }
            }
            function removeMultipleGroupMembers() {
                if ($('input:checked[name=selectedMembers]').length == 0) {
                    <fmt:message var="i18nRemoveMultipleNothingSelected" key="siteSettings.groups.removeMembers.nothingSelected"/>
                    $.snackbar({
                        content: "${functions:escapeJavaScript(i18nRemoveMultipleNothingSelected)}",
                        style: "warning"
                    });
                    return false;
                }
                if (confirm('${functions:escapeJavaScript(i18nRemoveMultipleConfirm)}' + ' ' + '${functions:escapeJavaScript(i18nContinue)}')) {
                    workInProgress('${i18nWaiting}');
                    return true;
                }
                return false;
            }
            $(document).ready(function() {
                $('#btnNewMembersReset').click(function() {
                    $('#newMembersTableBody tr').remove();
                    newMembersArray=new Array();
                    $('#newMembers').hide();
                    return false;
                });
                $(':checkbox[name="selectedMembers"]').click(function() {
                    if (!this.checked) {
                        $.each($('#cbSelectedAllMembers'), function() {
                            this.checked = false;
                        })
                    }
                });
                $('#cbSelectedAllMembers').click(function() {
                    var state=this.checked;
                    $.each($(':checkbox[name="selectedMembers"]'), function() {
                        this.checked=state;
                    });
                });
            })
        </script>
    </template:addResources>
</c:if>

<div class="page-header">
    <h2><fmt:message key="label.group"/>: ${fn:escapeXml(user:displayName(group))}</h2>
</div>

<c:set var="multipleProvidersAvailable" value="${fn:length(providers) > 1}"/>
<c:set var="members" value="${group.members}"/>

<c:if test="${not isGroupEditable && memberCount == 0}">
    <c:forEach items="${members}" var="member" end="${memberDisplayLimit}" varStatus="loopStatus">
        <c:set var="memberCount" value="${memberCount + 1}"/>
    </c:forEach>
</c:if>

<c:set var="membersFound" value="${memberCount > 0}"/>

<c:if test="${isGroupEditable}">
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
</c:if>

<c:if test="${memberCount > memberDisplayLimit}">
    <form action="${flowExecutionUrl}" method="POST" style="display: inline;" onsubmit="workInProgress('${i18nWaiting}');">
        <div class="alert alert-info">
            <c:if test="${isGroupEditable}">
                <fmt:message key="siteSettings.groups.members.found">
                    <fmt:param value="${memberCount}"/>
                </fmt:message>
            </c:if>
            <fmt:message key="siteSettings.groups.first.shown">
                <fmt:param value="${memberDisplayLimit}"/>
            </fmt:message>
            <input type="hidden" id="memberFormDisplayLimit" name="displayLimit" value="<%= Integer.MAX_VALUE %>" />
            <button class="btn btn-default btn-raised" type="submit" name="_eventId_refresh" data-sel-role="showAll">
                <fmt:message key="siteSettings.groups.members.showAll"/>
            </button>
            <c:if test="${memberCount > 100}">
                - <fmt:message key="siteSettings.groups.members.showAll.notice"/>
            </c:if>
        </div>
    </form>
</c:if>

<div class="panel panel-default">
    <div class="panel-body">
        <form action="${flowExecutionUrl}" method="POST" class="form-inline">

            <div class="row">
                <div class="col-md-6">
                    <h4>
                        <button class="btn btn-default btn-fab btn-fab-mini" type="submit" name="_eventId_cancel"
                                data-placement="top" data-container="body"
                                data-toggle="tooltip" data-title="<fmt:message key='label.backToGroupList'/>">
                            <i class="material-icons">arrow_back</i>
                        </button>
                        <fmt:message key="members.label"/>&nbsp;<c:if test="${isGroupEditable}">(${memberCount})</c:if>
                    </h4></div>
                <div class="col-md-6 text-right">
                    <c:if test="${isGroupEditable}">
                        <c:if test="${membersFound}">
                            <button class="btn btn-danger" type="submit" name="_eventId_removeMembers" onclick="return removeMultipleGroupMembers();">
                                <fmt:message key="siteSettings.groups.removeMembers"/>
                            </button>
                        </c:if>
                        <button class="btn btn-primary btn-raised" type="submit" name="_eventId_editGroupMembers" >
                            <fmt:message key="siteSettings.groups.editMembers"/>
                        </button>
                    </c:if>
                </div>
            </div>

            <table class="table table-bordered table-striped">
                <thead>
                    <tr>
                        <c:if test="${isGroupEditable}">
                            <th width="2%">
                                <div class="checkbox">
                                    <label for="cbSelectedAllMembers">
                                        <input type="checkbox" name="selectedAllMembers" id="cbSelectedAllMembers"/>
                                    </label>
                                </div>
                            </th>
                        </c:if>
                        <th width="3%">#</th>
                        <th width="3%">&nbsp;</th>
                        <th><fmt:message key="label.username"/></th>
                        <th><fmt:message key="label.name"/></th>
                        <c:if test="${multipleProvidersAvailable}">
                            <th width="10%"><fmt:message key="column.provider.label"/></th>
                        </c:if>
                        <c:if test="${isGroupEditable}">
                            <th width="20%"><fmt:message key="label.actions"/></th>
                        </c:if>
                    </tr>
                </thead>
                <tbody>
                <c:choose>
                    <c:when test="${!membersFound}">
                        <tr>
                            <td colspan="${(multipleProvidersAvailable ? 7 : 6) - (isGroupEditable ? 0 : 2)}"><fmt:message key="label.noItemFound"/></td>
                        </tr>
                    </c:when>
                    <c:otherwise>
                        <fmt:message var="i18nRemove" key="label.remove"/><c:set var="i18nRemove" value="${fn:escapeXml(i18nRemove)}"/>
                        <c:forEach items="${members}" var="member" end="${memberDisplayLimit - 1}" varStatus="loopStatus">
                            <c:set var="principalType" value="${jcr:isNodeType(member,'jnt:user')?'u':'g'}"/>
                            <c:set var="principalIcon" value="${principalType == 'u' ? 'person' : 'people'}"/>
                            <c:set var="principalKey" value="${principalType}:${principalType == 'u' ? member.userKey : member.groupKey}"/>
                            <tr>
                                <c:if test="${isGroupEditable}">
                                    <td>
                                        <div class="checkbox">
                                            <label>
                                                <input type="checkbox" name="selectedMembers" value="${principalKey}"/>
                                            </label>
                                        </div>
                                    </td>
                                </c:if>
                                <td>
                                    ${loopStatus.count}
                                </td>
                                <td>
                                  <i class="material-icons" style="vertical-align:middle">${principalIcon}</i>
                                </td>
                                <td>
                                    ${fn:escapeXml(user:displayName(member))}
                                </td>
                                <td>
                                    ${fn:escapeXml(user:fullName(member))}
                                </td>
                                <c:if test="${multipleProvidersAvailable}">
                                    <fmt:message var="i18nProviderLabel" key="providers.${member.providerName}.label"/>
                                    <td>${fn:escapeXml(fn:contains(i18nProviderLabel, '???') ? member.providerName : i18nProviderLabel)}</td>
                                </c:if>
                                <c:if test="${isGroupEditable}">
                                    <td>
                                        <fmt:message var="i18RemoveConfirm" key="siteSettings.groups.removeMember.confirm">
                                            <fmt:param value="${fn:escapeXml(member.name)}"/>
                                        </fmt:message>
                                        <button style="margin-bottom:0;" class="btn btn-danger btn-fab btn-fab-xs" type="submit" name="_eventId_removeMembers"
                                                onclick="return removeGroupMember('${functions:escapeJavaScript(i18RemoveConfirm)}' + ' ' + '${functions:escapeJavaScript(i18nContinue)}', '${principalKey}')">
                                            <i class="material-icons">delete</i>
                                        </button>
                                    </td>
                                </c:if>
                            </tr>
                        </c:forEach>
                    </c:otherwise>
                </c:choose>
                </tbody>
            </table>
        </form>
    </div>
</div>
