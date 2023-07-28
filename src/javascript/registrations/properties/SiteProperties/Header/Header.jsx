import {Button, Header} from '@jahia/moonstone';
import React from 'react';
import PropTypes from 'prop-types';
import {useTranslation} from 'react-i18next';
import {useNodeChecks} from '@jahia/data-helper';

export const HeaderComp = ({edit, siteDisplayName, path, language}) => {
    const {t} = useTranslation('siteSettings');
    const res = useNodeChecks({path, language}, {requiredPermission: 'jcr:write'});

    if (res.loading || res.error) {
        return null;
    }

    const actions = res.checksResult ? [<Button key="edit-site" color="accent" label={t('properties.edit')} size="big" data-sel-role="edit-site-properties" onClick={edit}/>] : [];

    return <Header title={siteDisplayName} mainActions={actions}/>;
};

HeaderComp.propTypes = {
    edit: PropTypes.func.isRequired,
    siteDisplayName: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    language: PropTypes.string.isRequired
};
