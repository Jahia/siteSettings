import React from 'react';
import PropTypes from 'prop-types';
import {Paper, Typography, Chip, Button} from '@jahia/moonstone';
import clsx from 'clsx';
import styles from './Content.scss';
import dayjs from 'dayjs';
import {useTranslation} from 'react-i18next';

function getFormattedDate(date, locale) {
    return dayjs(date).locale(locale).format('LLL');
}

export const Content = ({site, language}) => {
    const {t} = useTranslation('siteSettings');

    const mandatoryLanguages = site.languages.filter(l => l.mandatory).map(l => (<Chip key={l.language} label={l.displayName} color="accent"/>));
    const additionalServerNames = site.additionalServerNames ? site.additionalServerNames.values.join(', ') : [];
    const navigateToLanguages = () => {
        window.location.pathname = `/jahia/administration/${site.name}/settings/languages`;
    };

    return (
        <Paper className={styles.paper}>
            <Typography variant="title" weight="bold" className={styles.heading}>{t('properties.generalInfo')}</Typography>
            <div className="flexCol">
                <div className={clsx('flexRow', styles.row)}>
                    <Typography variant="subheading" weight="bold" className={styles.left}>{t('properties.title')}</Typography>
                    <Typography variant="body" className={styles.right}>{site.displayName}</Typography>
                </div>
                <div className={clsx('flexRow', styles.row)}>
                    <Typography variant="subheading" weight="bold" className={styles.left}>{t('properties.description')}</Typography>
                    <Typography variant="body" className={styles.right}>{site.description || '-'}</Typography>
                </div>
                <div className={clsx('flexRow', styles.row)}>
                    <Typography variant="subheading" weight="bold" className={styles.left}>{t('properties.creationDate')}</Typography>
                    <Typography variant="body" className={styles.right}>{getFormattedDate(site.created.value, language)}</Typography>
                </div>
                <div className={clsx('flexRow', styles.row)}>
                    <Typography variant="subheading" weight="bold" className={styles.left}>{t('properties.serverName')}</Typography>
                    <Typography variant="body" className={styles.right}>{site.serverName}</Typography>
                </div>
                <div className={clsx('flexRow', styles.row)}>
                    <Typography variant="subheading" weight="bold" className={styles.left}>{t('properties.additionalServerNames')}</Typography>
                    <Typography variant="body" className={styles.right}>{additionalServerNames.length === 0 ? '-' : additionalServerNames}</Typography>
                </div>
                <div className={clsx('flexRow', styles.row)}>
                    <Typography variant="subheading" weight="bold" className={styles.left}>{t('properties.templateSet')}</Typography>
                    <Typography variant="body" className={styles.right}>{site.templateSet.value}</Typography>
                </div>
            </div>
            <Typography variant="title" weight="bold" className={styles.heading}>{t('properties.languages')}</Typography>
            <div className="flexCol">
                <div className={clsx('flexRow', styles.row)}>
                    <Button label={t('properties.editLang')} variant="ghost" data-sel-role="edit-languages" onClick={navigateToLanguages}/>
                </div>
                <div className={clsx('flexRow', styles.row)}>
                    <Typography variant="subheading" weight="bold" className={styles.left}>{t('properties.languages')}</Typography>
                    <div className={styles.right}>
                        {site.languages.map(l => (<Chip key={l.language} label={l.displayName} color="accent"/>))}
                    </div>
                </div>
                <div className={clsx('flexRow', styles.row)}>
                    <Typography variant="subheading" weight="bold" className={styles.left}>{t('properties.mandatoryLanguages')}</Typography>
                    <div className={styles.right}>
                        {mandatoryLanguages.length === 0 ? '-' : mandatoryLanguages}
                    </div>
                </div>
                <div className={clsx('flexRow', styles.row)}>
                    <Typography variant="subheading" weight="bold" className={styles.left}>{t('properties.defaultLanguage')}</Typography>
                    <div className={styles.right}>
                        <Chip label={site.languages.find(l => l.language === site.defaultLanguage).displayName} color="accent"/>
                    </div>
                </div>
            </div>
        </Paper>
    );
};

Content.propTypes = {
    language: PropTypes.string.isRequired,
    site: PropTypes.object.isRequired
};
