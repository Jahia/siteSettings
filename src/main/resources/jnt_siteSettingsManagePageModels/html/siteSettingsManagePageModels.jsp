<%@ taglib prefix="jcr" uri="http://www.jahia.org/tags/jcr" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="utility" uri="http://www.jahia.org/tags/utilityLib" %>
<%@ taglib prefix="template" uri="http://www.jahia.org/tags/templateLib" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%--@elvariable id="currentNode" type="org.jahia.services.content.JCRNodeWrapper"--%>
<%--@elvariable id="out" type="java.io.PrintWriter"--%>
<%--@elvariable id="script" type="org.jahia.services.render.scripting.Script"--%>
<%--@elvariable id="scriptInfo" type="java.lang.String"--%>
<%--@elvariable id="workspace" type="java.lang.String"--%>
<%--@elvariable id="renderContext" type="org.jahia.services.render.RenderContext"--%>
<%--@elvariable id="currentResource" type="org.jahia.services.render.Resource"--%>
<%--@elvariable id="url" type="org.jahia.services.render.URLGenerator"--%>
<c:set var="resourceReadOnly" value="${currentResource.moduleParams.readOnly}"/>
<template:include view="hidden.header"/>
<c:set var="isEmpty" value="true"/>
<c:set var="site" value="${renderContext.mainResource.node.resolveSite}"/>
<template:addResources type="javascript" resources="jquery.min.js"/>
<template:addResources type="javascript" resources="datatables/jquery.dataTables.js,i18n/jquery.dataTables-${currentResource.locale}.js,datatables/dataTables.bootstrap-ext.js"/>
<template:addResources type="css" resources="datatables/css/bootstrap-theme.css,tablecloth.css"/>

<template:addResources>
    <script type="text/javascript">
        $(document).ready(function () {
            $('#pageModelsTable').dataTable({
                "sDom": "<'row-fluid'<'span6'l><'span6'<'refresh_modules'>f>r>t<'row-fluid'<'span6'i><'span6'p>>",
                "iDisplayLength": 25,
                "sPaginationType": "bootstrap",
                "aaSorting": [], //this option disable sort by default, the user steal can use column names to sort the table
                "bStateSave": true
            });
        });
    </script>
</template:addResources>

<h2><fmt:message key="siteSettings.label.pageModelsLSettings"/> - ${fn:escapeXml(site.displayableName)}</h2>


<table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered" id="pageModelsTable">
    <thead>
    <tr>
        <th><fmt:message key='siteSettings.label.pageModelsLSettings.pagemodel.name'/></th>
        <th><fmt:message key='siteSettings.label.pageModelsLSettings.pagename'/></th>
        <th><fmt:message key='siteSettings.label.pageModelsLSettings.pagepath'/></th>
    </tr>
    </thead>
    <tbody>
    <jsp:useBean id="pageModelsNodesID" class="java.util.HashMap" type="java.util.HashMap"/>
    <c:forEach items="${moduleMap.currentList}" var="subchild" begin="${moduleMap.begin}" end="${moduleMap.end}"
               varStatus="status">
        <c:if test="${empty pageModelsNodesID[subchild.identifier]}">
            <tr class="${status.index % 2 == 0 ? 'evenLine' : 'oddLine'}">
                <td>
                    <div class="jahia-template-gxt" jahiatype="module" id="module${subchild.identifier}" type="existingNode"
                         scriptInfo="" path="${subchild.path}" template="hidden.system" dragdrop="false">
                        ${subchild.properties["j:pageTemplateTitle"].string}
                    </div>
                </td>
                <td>
                    <a href="<c:url value='${url.base}${subchild.path}.html'/>">${subchild.displayableName}</a>
                </td>
                <td>  <a href="<c:url value='${url.base}${subchild.path}.html'/>">${subchild.path}</a></td>

            </tr>
            <c:set var="isEmpty" value="false"/>
            <c:set target="${pageModelsNodesID}" property="${subchild.parent.identifier}" value="${subchild.parent.identifier}"/>
        </c:if>
    </c:forEach>
    </tbody>
</table>

<c:if test="${not empty moduleMap.emptyListMessage and (renderContext.editMode or moduleMap.forceEmptyListMessageDisplay) and isEmpty}">
    <div class="alert alert-info">${moduleMap.emptyListMessage}</div>
</c:if>
<template:include view="hidden.footer"/>
