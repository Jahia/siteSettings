/*
 * The nodetypes this module defines that carry a picker-exclusion marker — the two conditions the render
 * filter applies. Returns them comma-separated.
 */

import org.jahia.services.content.nodetypes.ExtendedNodeType
import org.jahia.services.content.nodetypes.NodeTypeRegistry

def MODULE_ID = '#MODULE_ID#'
def MARKERS = ['jmix:studioOnly', 'jmix:hiddenType']

def registry = NodeTypeRegistry.getInstance()
def names = []

for (ExtendedNodeType nt : registry.getAllNodeTypes()) {
    if (MODULE_ID == nt.getSystemId() && MARKERS.any { nt.isNodeType(it) }) {
        names << nt.getName()
    }
}

setResult(names.sort().join(','))
