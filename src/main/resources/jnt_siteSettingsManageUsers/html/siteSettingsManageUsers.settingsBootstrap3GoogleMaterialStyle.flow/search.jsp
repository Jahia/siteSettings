<%@ page language="java" contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="template" uri="http://www.jahia.org/tags/templateLib" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="jcr" uri="http://www.jahia.org/tags/jcr" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="functions" uri="http://www.jahia.org/tags/functions" %>
<%@ taglib prefix="user" uri="http://www.jahia.org/tags/user" %>
<%@ page import="org.jahia.settings.SettingsBean "%>
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
<%--@elvariable id="searchCriteria" type="org.jahia.modules.sitesettings.users.management.SearchCriteria"--%>
<template:addResources type="javascript" resources="jquery.min.js,jquery-ui.min.js,jquery.metadata.js,jquery.tablesorter.js,jquery.tablecloth.js"/>
<template:addResources type="css" resources="jquery-ui.smoothness.css,jquery-ui.smoothness-jahia.css,tablecloth.css"/>

<c:set var="userDisplayLimit" value="${siteSettingsProperties.userDisplayLimit}"/>
<c:set var="jcrUserCountLimit" value="<%= SettingsBean.getInstance().getJahiaJCRUserCountLimit() %>"/>

<template:addResources>
<script type="text/javascript">
    $(document).ready(function () {
        $("table").tablecloth({
            theme: "default",
            sortable: true
        });
    });

    function doUserAction(event, selectedUsers){
        var form = $("#usersForm");
        form.find("#flowEvent").val(event);
        form.find("#selectedUsers").val(selectedUsers);
        form.submit();
    }

    function doUsersAction(event) {
        var val = [];
        $('.userCheckbox:checkbox:checked').each(function (i) {
            val[i] = $(this).val();
        });

        if(val.length > 0){
            doUserAction(event, val.join(","));
        } else {
            alert("<fmt:message key="siteSettings.user.select.one"/>")
        }
    }
</script>
</template:addResources>
<c:set var="multipleProvidersAvailable" value="${fn:length(providersList) > 1}"/>

<div class="page-header">
    <h2><fmt:message key="label.manageUsers"/></h2>
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

        <div>
            <button class="btn btn-default btn-sm" type="submit" onclick="doUserAction('addUser')">
                <i class="material-icons">add</i>
                <fmt:message key='siteSettings.user.create'/>
            </button>
            <button class="btn btn-default btn-sm" type="submit" onclick="doUserAction('bulkAddUser')">
                <i class="material-icons">group_add</i>
                <fmt:message key='siteSettings.users.bulk.create'/>
            </button>
            <button class="btn btn-default btn-sm" type="submit" onclick="doUsersAction('bulkDeleteUser')">
                <i class="material-icons">delete</i>
                <fmt:message key="siteSettings.user.remove"/>
            </button>
        </div>

        <form class="form-inline " action="${flowExecutionUrl}" id="searchForm" method="post">
            <h4><fmt:message key="label.search"/></h4>
            <div class="form-group form-group-sm label-floating">
                <label class="control-label" for="searchString">
                    <fmt:message key="label.search"/>
                </label>
                <div class="input-group">
                    <input class="form-control" type="text" id="searchString" name="searchString"
                           value='${searchCriteria.searchString}'
                           onkeydown="if (event.keyCode == 13) submitForm('search');"/>
                    <span class="input-group-btn">
                        <button class="btn btn-fab btn-fab-xs btn-primary" type="submit"  name="_eventId_search">
                            <i class="material-icons">search</i>
                        </button>
                    </span>
                </div>
            </div>

            <br />
            <div class="form-group form-group-sm">
                <span><fmt:message key="label.in"/></span>
                <div class="radio">
                    <label class="radio-inline" for="searchIn">
                        <input type="radio" id="searchIn" name="searchIn" value="allProps"
                               <c:if test="${empty searchCriteria.searchIn or searchCriteria.searchIn eq 'allProps'}">checked</c:if>
                               onclick="$('.propCheck').attr('disabled',true);">
                        <fmt:message key="label.allProperties"/>
                    </label>
                </div>
                <div class="radio">
                    <label class="radio-inline" for="searchInProperties">
                    <input type="radio" name="searchIn" id="searchInProperties" value="properties"
                           <c:if test="${searchCriteria.searchIn eq 'properties'}">checked</c:if>
                           onclick="$('.propCheck').removeAttr('disabled');">
                        <fmt:message key="siteSettings.user.properties.selected"/>:
                    </label>
                </div>
            </div>

            <div class="form-group form-group-sm">
                <div class="checkbox">
                    <label for="propsUsersname">
                        <input type="checkbox" class="propCheck" name="properties" value="username" id="propsUsersname"
                               <c:if test="${searchCriteria.searchIn ne 'properties'}">disabled</c:if>
                               <c:if test="${not empty searchCriteria.properties and functions:contains(searchCriteria.properties, 'username')}">checked="checked"</c:if> >
                        <fmt:message key="label.username"/>
                    </label>
                </div>
            </div>

            <div class="form-group form-group-sm">
                <div class="checkbox">
                    <label for="propsFirstName">
                        <input type="checkbox" class="propCheck" name="properties" value="j:firstName" id="propsFirstName"
                               <c:if test="${searchCriteria.searchIn ne 'properties'}">disabled</c:if>
                               <c:if test="${not empty searchCriteria.properties and functions:contains(searchCriteria.properties, 'j:firstName')}">checked="checked"</c:if> >
                        <fmt:message key="label.firstName"/>
                    </label>
                </div>
            </div>

            <div class="form-group form-group-sm">
                <div class="checkbox">
                    <label for="propsLastName">
                        <input type="checkbox" class="propCheck" name="properties" value="j:lastName" id="propsLastName"
                               <c:if test="${searchCriteria.searchIn ne 'properties'}">disabled</c:if>
                               <c:if test="${not empty searchCriteria.properties and functions:contains(searchCriteria.properties, 'j:lastName')}">checked="checked"</c:if> >
                        <fmt:message key="label.lastName"/>
                    </label>
                </div>
            </div>

            <div class="form-group form-group-sm">
                <div class="checkbox">
                    <label for="propsEmail">
                        <input type="checkbox" class="propCheck" name="properties" value="j:email" id="propsEmail"
                               <c:if test="${searchCriteria.searchIn ne 'properties'}">disabled</c:if>
                               <c:if test="${not empty searchCriteria.properties and functions:contains(searchCriteria.properties, 'j:email')}">checked="checked"</c:if> >
                        <fmt:message key="label.email"/>
                    </label>
                </div>
            </div>

            <div class="form-group form-group-sm">
                <div class="checkbox">
                    <label for="propsOrganization">
                        <input type="checkbox" class="propCheck" name="properties" value="j:organization" id="propsOrganization"
                               <c:if test="${searchCriteria.searchIn ne 'properties'}">disabled</c:if>
                               <c:if test="${not empty searchCriteria.properties and functions:contains(searchCriteria.properties, 'j:organization')}">checked="checked"</c:if> >
                        <fmt:message key="label.organization"/>
                    </label>
                </div>
            </div>

            <c:if test="${multipleProvidersAvailable}">
                <br />
                <div class="form-group form-group-sm">
                    <span><fmt:message key="label.on"/></span>
                    <div class="radio">
                        <label for="storeOnEverywhere">
                            <input type="radio" name="storedOn" id="storeOnEverywhere" value="everywhere"
                                   <c:if test="${empty searchCriteria.storedOn or searchCriteria.storedOn eq 'everywhere'}">checked</c:if>
                                   onclick="$('.provCheck').attr('disabled',true);">
                            <fmt:message key="label.everyWhere"/>
                        </label>
                    </div>

                    <div class="radio">
                        <label for="storedOn">
                            <input type="radio" id="storedOn" name="storedOn" value="providers"
                                    <c:if test="${searchCriteria.storedOn eq 'providers'}"> checked </c:if>
                                    onclick="$('.provCheck').removeAttr('disabled');">
                            <fmt:message key="label.providers"/>:
                        </label>
                    </div>
                </div>

                <c:forEach items="${providersList}" var="curProvider">
                    <div class="form-group form-group-sm">
                        <div class="checkbox">
                            <label for="provider-${curProvider}">
                                <input type="checkbox" class="provCheck" name="providers" id="provider-${curProvider}" value="${curProvider}"
                                        <c:if test="${fn:length(providersList) le 1 or searchCriteria.storedOn ne 'providers'}">disabled </c:if>
                                        <c:if test="${fn:length(providersList) le 1 or (not empty searchCriteria.providers and functions:contains(searchCriteria.providers, curProvider))}"> checked </c:if>>
                                <fmt:message var="i18nProviderLabel" key="providers.${curProvider}.label"/>
                                ${fn:escapeXml(fn:contains(i18nProviderLabel, '???') ? curProvider : i18nProviderLabel)}
                            </label>
                        </div>
                    </div>
                </c:forEach>
            </c:if>
        </form>

        <c:set var="userCount" value="${fn:length(users)}"/>
        <div>
            <h4><fmt:message key="siteSettings.user.search.result"/></h4>
            <div class="alert alert-info">
                <c:if test="${(userCount + searchCriteria.numberOfRemovedJahiaAdministrators) lt userDisplayLimit || jcrUserCountLimit lt 0}">
                    <fmt:message key="siteSettings.user.search.found">
                        <fmt:param value="${userCount}"/>
                    </fmt:message>
                </c:if>
                <c:if test="${(userCount + searchCriteria.numberOfRemovedJahiaAdministrators) ge userDisplayLimit}">&nbsp;<fmt:message
                        key="siteSettings.user.search.found.limit">
                    <fmt:param value="${(userDisplayLimit-searchCriteria.numberOfRemovedJahiaAdministrators)}"/>
                </fmt:message>
                </c:if>
                <c:choose>
                    <c:when test="${searchCriteria.numberOfRemovedJahiaAdministrators eq 1}"><br/><fmt:message key="siteSettings.user.search.renoved.administrator">
                        <fmt:param value="${searchCriteria.numberOfRemovedJahiaAdministrators}"/>
                    </fmt:message></c:when>
                    <c:when test="${searchCriteria.numberOfRemovedJahiaAdministrators gt 1}"><br/><fmt:message key="siteSettings.user.search.renoved.administrators">
                        <fmt:param value="${searchCriteria.numberOfRemovedJahiaAdministrators}"/>
                    </fmt:message></c:when>
                </c:choose>
            </div>

            <table class="table table-bordered table-striped table-hover">
                <thead>
                    <tr>
                        <th class="sortable" width="5%">#</th>
                        <th class="{sorter: false}" width="5%">&nbsp;</th>
                        <th class="sortable"><fmt:message key="label.name"/></th>
                        <th width="43%" class="sortable"><fmt:message key="label.properties"/></th>
                        <c:if test="${multipleProvidersAvailable}">
                            <th width="10%"><fmt:message key="column.provider.label"/></th>
                        </c:if>
                        <th width="10%"><fmt:message key="label.actions"/></th>
                    </tr>
                </thead>
                <tbody>
                <fmt:message var="i18nEdit" key="label.edit"/><c:set var="i18nEdit" value="${fn:escapeXml(i18nEdit)}"/>
                <fmt:message var="i18nRemove" key="label.remove"/><c:set var="i18nRemove" value="${fn:escapeXml(i18nRemove)}"/>
                <c:choose>
                    <%--@elvariable id="users" type="java.util.List"--%>
                    <c:when test="${userCount eq 0}">
                        <tr>
                            <td colspan="${multipleProvidersAvailable ? '6' : '5'}"><fmt:message key="siteSettings.user.search.no.result"/></td>
                        </tr>
                    </c:when>
                    <c:otherwise>
                        <c:forEach items="${users}" var="curUser" end="${userDisplayLimit - 1}" varStatus="loopStatus">
                            <tr class="sortable-row">
                                <td>${loopStatus.count}</td>
                                <td>
                                    <c:choose>
                                        <c:when test="${curUser.properties['j:external'].boolean}">
                                            &nbsp;
                                        </c:when>
                                        <c:otherwise>
                                            <div class="checkbox">
                                                <label>
                                                    <input type="checkbox" name="userCheckbox" value="${fn:escapeXml(curUser.path)}" class="userCheckbox">
                                                </label>
                                            </div>
                                        </c:otherwise>
                                    </c:choose>
                                </td>
                                <td><a href="#" onclick="doUserAction('editUser', '${fn:escapeXml(curUser.path)}')">${user:displayName(curUser)}</a></td>
                                <td>${user:fullName(curUser)}</td>
                                <c:if test="${multipleProvidersAvailable}">
                                    <fmt:message var="i18nProviderLabel" key="providers.${curUser.providerName}.label"/>
                                    <td>${fn:escapeXml(fn:contains(i18nProviderLabel, '???') ? curUser.providerName : i18nProviderLabel)}</td>
                                </c:if>
                                <td>
                                    <a class="btn btn-fab btn-fab-xs btn-default" href="#edit"
                                       title="${i18nEdit}" onclick="doUserAction('editUser', '${fn:escapeXml(curUser.path)}')">
                                        <i class="material-icons">edit</i>
                                    </a>
                                    <c:if test="${curUser.name != 'guest' && !curUser.properties['j:external'].boolean}">
                                        <a class="btn btn-danger btn-fab btn-fab-xs" title="${i18nRemove}"
                                           href="#delete" onclick="doUserAction('removeUser', '${fn:escapeXml(curUser.path)}')">
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
</div>

<form style="display: none" action="${flowExecutionUrl}" id="usersForm" method="post">
    <input type="hidden" name="_eventId" id="flowEvent">
    <input type="hidden" name="selectedUsers" id="selectedUsers">
</form>
