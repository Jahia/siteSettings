<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="jcr" uri="http://www.jahia.org/tags/jcr" %>
<%@ taglib prefix="s" uri="http://www.jahia.org/tags/search" %>
<%@ taglib prefix="functions" uri="http://www.jahia.org/tags/functions" %>
<%@ taglib prefix="template" uri="http://www.jahia.org/tags/templateLib" %>
<fmt:message key="label.delete" var="i18nDelete"/><c:set var="i18nDelete" value="${functions:escapeJavaScript(i18nDelete)}"/>
<fmt:message key="label.htmlFiltering.invalidTag" var="i18nInvalidTag"/><c:set var="i18nInvalidTag" value="${functions:escapeJavaScript(i18nInvalidTag)}"/>
<fmt:message key="label.changeSaved" var="i18nSaved"/><c:set var="i18nSaved" value="${functions:escapeJavaScript(i18nSaved)}"/>

<template:addResources type="javascript" resources="jquery.min.js,jquery.form.min.js"/>
<template:addResources>
    <script type="text/javascript">
        $(document).ready(function() {
            $('#addHtmlTag').click(function() {
                htmlFilteringAddHtmlTag();
                return false;
            });
            $("#newHtmlTag").keypress(function(evt) {
                if (evt.which == 13) {
                    htmlFilteringAddHtmlTag();
                    return false;
                }
            });
            $("input.btnDeleteHtmlTag").click(function() {
                $(this).parent().parent().remove(); return false;
            });
        });

        function htmlFilteringAddHtmlTag() {
            var newTag = $('#newHtmlTag');
            var val = newTag.val();
            if (val.length == 0) {
                return;
            }
            var match = val.match(/[A-Za-z]+[1-9]*/);
            if (match == null || match[0] != val) {
                $.snackbar({
                    content: "${i18nInvalidTag}",
                    style: "error"
                });
                return;
            }
            if ($('#btnDeleteHtmlTag' + val).length == 0) {
                $('#tblHtmlTags').find('tbody:last').append('<tr>'
                        + '<td width="80%"><strong class="htmlTagToFilter">' + val + '</strong></td>'
                        + '<td width="20%" class="text-center"><button style="margin-bottom:0px;" title="${i18nDelete}" onclick="$(this).parent().parent().remove(); return false;" class="btn btn-fab btn-fab-xs btn-danger" type="button" id="addHtmlTag"><i class="material-icons">delete</i></button></td>'
                        + '</tr>');
            }
            newTag.val('');
        }

        function updateSiteHtmlFiltering(btn) {
            btn.attr('disabled', 'disabled');
            var tags='';
            $('strong.htmlTagToFilter').each(function() {
                    if (tags.length > 0) {
                        tags+=',';
                    }
                    tags+=$(this).text();
                }
            );
            var data={
                    'j:doTagFiltering':$('#activateTagFiltering').is(':checked'),
                    'j:filteredTags':tags
            };
            $('#updateSiteForm').ajaxSubmit({
                data: data,
                dataType: "json",
                success: function(response) {
                    if (response.warn != undefined) {
                        $.snackbar({
                            content: response.warn,
                            style: "error"
                        });
                    } else {
                        $.snackbar({
                            content: "${i18nSaved}"
                        });
                    }
                    btn.removeAttr('disabled');
                },
                error: function() {
                    btn.removeAttr('disabled');
                }
            });
        }
    </script>
</template:addResources>
<c:set var="site" value="${renderContext.mainResource.node.resolveSite}"/>
<c:set var="propFilteringActivated" value="${site.properties['j:doTagFiltering']}"/>
<c:set var="propFilteredTags" value="${site.properties['j:filteredTags']}"/>
<c:set var="filteredTags" value="${not empty propFilteredTags ? propFilteredTags.string : ''}"/>

<div class="page-header">
    <h2><fmt:message key="siteSettings.label.htmlFiltering"/> - ${fn:escapeXml(site.displayableName)}</h2>
</div>

<div class="row">
    <div class="col-md-offset-2 col-md-8">
        <div class="panel panel-default">
            <div class="panel-heading">
                <fmt:message key="label.htmlFiltering.description"/>
            </div>
            <div class="panel-body">
                <form id="updateSiteForm" action="<c:url value='${url.base}${renderContext.mainResource.node.resolveSite.path}'/>" method="post">
                    <input type="hidden" name="jcrMethodToCall" value="put"/>
                    <input type="hidden" name="jcr:mixinTypes" value="jmix:htmlSettings"/>

                    <div class="togglebutton">
                        <label for="activateTagFiltering">
                            <input type="checkbox" name="activateTagFiltering" id="activateTagFiltering"${not empty propFilteringActivated && propFilteringActivated.boolean ? ' checked="checked"' : ''}/>
                            <fmt:message key="label.active"/>
                        </label>
                    </div>

                    <fmt:message key="label.add" var="i18nAdd"/>
                    <div class="form-group label-floating">
                        <label class="control-label">${i18nAdd}</label>
                        <div class="input-group">
                            <input class="form-control" type="text" name="newHtmlTag" id="newHtmlTag" value="" size="10"/>
                            <span class="input-group-btn">
                                <button title="${i18nAdd}" class="btn btn-fab btn-fab-xs btn-primary" type="button" id="addHtmlTag">
                                    <i class="material-icons">add</i>
                                </button>
                            </span>
                        </div>
                    </div>

                    <table id="tblHtmlTags" class="table table-striped table-hover" >
                        <thead>
                        <tr>
                            <th>
                                <fmt:message key="label.tags"/>
                            </th>
                            <th class="text-center">
                                <fmt:message key="label.actions"/>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <c:forTokens var="tag" items="${filteredTags}" delims=", ">
                            <tr id="rowHtmlTag${tag}">
                                <fmt:message key="label.delete" var="i18nDelete"/>
                                <c:set var="i18nDelete" value="${fn:escapeXml(i18nDelete)}"/>
                                <td width="80%">
                                    <strong class="htmlTagToFilter">${tag}</strong>
                                </td>
                                <td width="20%" class="text-center">
                                    <button title="${i18nDelete}" class="btn btn-fab btn-fab-xs btn-danger" type="button" onclick="$(this).parent().parent().remove(); return false;">
                                        <i class="material-icons">delete</i>
                                    </button>
                                </td>
                            </tr>
                        </c:forTokens>
                        </tbody>
                    </table>

                    <button class="btn btn-primary pull-right" type="button" name="save" onclick="updateSiteHtmlFiltering($(this)); return false;">
                        <fmt:message key='label.save'/>
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>
