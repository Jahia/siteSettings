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
<%--@elvariable id="memberSearchCriteria" type="org.jahia.services.usermanager.SearchCriteria"--%>
<%--@elvariable id="principals" type="java.util.Map<org.jahia.services.content.decorator.JCRUserNode,java.lang.Boolean>"--%>

<c:set var="prefix" value="u:"/>
<c:set var="displayUsers" value="selected"/>
<c:set var="userDisplayLimit" value="${siteSettingsProperties.userDisplayLimit}"/>

<div class="page-header">
    <h2><fmt:message key="label.group"/>: ${fn:escapeXml(user:displayName(group))}</h2>
</div>

<div class="panel panel-default">
    <div class="panel-body">

        <%@include file="common/editMembersHead.jspf" %>

        <c:if test="${not quickAddMembers}">
            <br />
            <p><fmt:message key="siteSettings.message.addRemoveUsers"/></p>
        </c:if>

        <form class="form-inline " action="${flowExecutionUrl}" id="searchForm" method="post">
            <input type="hidden" id="searchIn" name="searchIn" value="allProps"/>

            <div class="form-group label-floating">
                <label class="control-label" for="searchString">
                    <fmt:message key="label.search"/>
                </label>
                <div class="input-group">
                    <input class="form-control" type="text" id="searchString" name="searchString"
                           value='${memberSearchCriteria.searchString}'
                           onkeydown="if (event.keyCode == 13) submitForm('search');"/>
                    <span class="input-group-btn">
                        <button class="btn btn-primary btn-fab btn-fab-xs" type="submit" name="_eventId_search">
                            <i class="material-icons">search</i>
                        </button>
                    </span>
                </div>
            </div>

            <c:if test="${multipleProvidersAvailable}">
                <div class="form-group form-group-sm">
                    <span><fmt:message key="label.on"/></span>
                    <div class="radio">
                        <label class="radio-inline">
                            <input type="radio" name="storedOn" value="everywhere"
                                ${empty memberSearchCriteria.storedOn || memberSearchCriteria.storedOn == 'everywhere' ? ' checked="checked" ' : ''}
                                   onclick="$('.provCheck').attr('disabled',true);">
                            <fmt:message key="label.everyWhere"/>
                        </label>
                    </div>

                    <div class="radio">
                        <label class="radio-inline">
                            <input type="radio" name="storedOn" value="providers"
                                ${memberSearchCriteria.storedOn == 'providers' ? 'checked="checked"' : ''}
                                   onclick="$('.provCheck').removeAttr('disabled');"/>
                            <fmt:message key="label.providers"/>
                        </label>
                    </div>
                </div>

                <c:forEach items="${providers}" var="curProvider">
                    <div class="form-group form-group-sm">
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" class="provCheck" name="providers" value="${curProvider}"
                                    ${memberSearchCriteria.storedOn != 'providers' ? 'disabled="disabled"' : ''}
                                    ${empty memberSearchCriteria.providers || functions:contains(memberSearchCriteria.providers, curProvider) ? 'checked="checked"' : ''}/>
                                    <fmt:message var="i18nProviderLabel" key="providers.${curProvider}.label"/>
                                    ${fn:escapeXml(fn:contains(i18nProviderLabel, '???') ? curProvider : i18nProviderLabel)}
                            </label>
                        </div>
                    </div>
                </c:forEach>
            </c:if>
        </form>

        <c:set var="principalsCount" value="${fn:length(principals)}"/>
        <c:set var="principalsFound" value="${principalsCount > 0}"/>
        <c:if test="${principalsCount > userDisplayLimit}">
            <div class="alert alert-info">
                <fmt:message key="siteSettings.users.found">
                    <fmt:param value="${principalsCount}"/>
                    <fmt:param value="${userDisplayLimit}"/>
                </fmt:message>
            </div>
        </c:if>

        <table class="table table-bordered table-striped">
            <thead>
            <tr>
                <th width="2%">
                    <div class="checkbox">
                        <label>
                            <input type="checkbox" name="selectedAllMembers" id="cbSelectedAllMembers"/>
                        </label>
                    </div>
                </th>
                <th><fmt:message key="label.username"/></th>
                <th width="43%" class="sortable"><fmt:message key="label.name"/></th>
                <c:if test="${multipleProvidersAvailable}">
                    <th width="10%"><fmt:message key="column.provider.label"/></th>
                </c:if>
            </tr>
            </thead>
            <tbody>
            <c:choose>
                <c:when test="${!principalsFound}">
                    <tr>
                        <td colspan="${multipleProvidersAvailable ? '4' : '3'}"><fmt:message key="label.noItemFound"/></td>
                    </tr>
                </c:when>
                <c:otherwise>
                    <c:forEach items="${principals}" var="principal" end="${userDisplayLimit - 1}" varStatus="loopStatus">
                        <tr>
                            <td>
                                <div class="checkbox">
                                    <label>
                                        <input onchange="selectMember(this)" class="selectedMember" type="checkbox" name="selectedMembers" value="${principal.key.userKey}" ${principal.value ? 'checked="checked"' : ''}/>
                                    </label>
                                </div>
                            </td>
                            <td>
                                ${fn:escapeXml(user:displayName(principal.key))}
                            </td>
                            <td>${user:fullName(principal.key)}</td>

                            <c:if test="${multipleProvidersAvailable}">
                                <fmt:message var="i18nProviderLabel" key="providers.${principal.key.providerName}.label"/>
                                <td>${fn:escapeXml(fn:contains(i18nProviderLabel, '???') ? principal.key.providerName : i18nProviderLabel)}</td>
                            </c:if>
                        </tr>
                    </c:forEach>
                </c:otherwise>
            </c:choose>
            </tbody>
        </table>
    </div>
</div>
