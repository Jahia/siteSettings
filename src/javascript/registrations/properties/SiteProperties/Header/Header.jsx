import {Button, Header} from '@jahia/moonstone';
import React from 'react';
import PropTypes from 'prop-types';
import {useTranslation} from 'react-i18next';

export const HeaderComp = ({edit, siteDisplayName}) => {
    const {t} = useTranslation('siteSettings');

    return (
        <Header title={siteDisplayName}
                mainActions={[
                    <Button key="edit-site" color="accent" label={t('properties.edit')} size="big" data-sel-role="edit-site-properties" onClick={edit}/>
        ]}/>
    );
};

HeaderComp.propTypes = {
    edit: PropTypes.func.isRequired,
    siteDisplayName: PropTypes.string.isRequired
};
