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
<%@include file="common/editMembersHead.jspf" %>

<div class="box-1">
    <form class="form-inline " action="${flowExecutionUrl}" id="searchForm" method="post">
        <input type="hidden" id="searchIn" name="searchIn" value="allProps"/>
        <fieldset>
            <h2><fmt:message key="label.search"/></h2>

            <div class="input-append">
                <label style="display: none;" for="searchString"><fmt:message key="label.search"/></label>
                <input class="span6" type="text" id="searchString" name="searchString"
                       value='${memberSearchCriteria.searchString}'
                       onkeydown="if (event.keyCode == 13) submitForm('search');"/>
                <button class="btn btn-primary" type="submit" name="_eventId_search">
                    <i class="icon-search icon-white"></i>
                    &nbsp;<fmt:message key='label.search'/>
                </button>
            </div>
            <c:if test="${multipleProvidersAvailable}">
                <br/>
                <label for="storedOn"><span class="badge badge-info"><fmt:message key="label.on"/></span></label>
                <input type="radio" name="storedOn" value="everywhere"
                    ${empty memberSearchCriteria.storedOn || memberSearchCriteria.storedOn == 'everywhere' ? ' checked="checked" ' : ''}
                       onclick="$('.provCheck').attr('disabled',true);">&nbsp;<fmt:message
                    key="label.everyWhere"/>

                <input type="radio" name="storedOn" value="providers"
                    ${memberSearchCriteria.storedOn == 'providers' ? 'checked="checked"' : ''}
                       onclick="$('.provCheck').removeAttr('disabled');"/>&nbsp;<fmt:message
                    key="label.providers"/>

                <c:forEach items="${providers}" var="curProvider">
                    <input type="checkbox" class="provCheck" name="providers" value="${curProvider}"
                        ${memberSearchCriteria.storedOn != 'providers' ? 'disabled="disabled"' : ''}
                        ${empty memberSearchCriteria.providers || functions:contains(memberSearchCriteria.providers, curProvider) ? 'checked="checked"' : ''}/>
                    <fmt:message var="i18nProviderLabel" key="providers.${curProvider}.label"/>
                    ${fn:escapeXml(fn:contains(i18nProviderLabel, '???') ? curProvider : i18nProviderLabel)}
                </c:forEach>
            </c:if>
        </fieldset>
    </form>
</div>

</div>

<form action="${flowExecutionUrl}" method="post" id="saveForm">
    <input id="addedMembers" type="hidden" name="addedMembers"/>
    <input id="removedMembers" type="hidden" name="removedMembers"/>
    <button class="btn btn-primary" type="submit" name="_eventId_save" id="saveButton" disabled="disabled">
        <i class="icon-ok icon-white"></i>
        &nbsp;<fmt:message key="label.save"/>
    </button>
</form>

<div>
    <c:set var="principalsCount" value="${fn:length(principals)}"/>
    <c:set var="principalsFound" value="${principalsCount > 0}"/>

    <table class="table table-bordered table-striped table-hover">
        <thead>
        <tr>
            <th width="2%"><input type="checkbox" name="selectedAllMembers" id="cbSelectedAllMembers"/></th>
            <th><fmt:message key="label.name"/></th>
            <th width="43%" class="sortable"><fmt:message key="label.properties"/></th>
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
                        <td><input onchange="selectMember(this)" class="selectedMember" type="checkbox" name="selectedMembers" value="${principal.key.userKey}" ${principal.value ? 'checked="checked"' : ''}/> </td>
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




