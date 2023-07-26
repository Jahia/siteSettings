import React from 'react';
import PropTypes from 'prop-types';
import {Paper, Typography, Chip} from '@jahia/moonstone';
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

    return (
        <Paper className={styles.paper}>
            <Typography variant="title" weight="bold" className={styles.heading}>{t('properties.generalInfo')}</Typography>
            <div className="flexCol">
                <div className={clsx('flexRow', styles.row)}>
                    <Typography variant="subheading" weight="bold" className={styles.left}>Title</Typography>
                    <Typography variant="body" className={styles.right}>{site.displayName}</Typography>
                </div>
                <div className={clsx('flexRow', styles.row)}>
                    <Typography variant="subheading" weight="bold" className={styles.left}>Description</Typography>
                    <Typography variant="body" className={styles.right}>{site.description || '-'}</Typography>
                </div>
                <div className={clsx('flexRow', styles.row)}>
                    <Typography variant="subheading" weight="bold" className={styles.left}>Creation date</Typography>
                    <Typography variant="body" className={styles.right}>{getFormattedDate(site.created.value, language)}</Typography>
                </div>
                <div className={clsx('flexRow', styles.row)}>
                    <Typography variant="subheading" weight="bold" className={styles.left}>Server Name</Typography>
                    <Typography variant="body" className={styles.right}>{site.serverName}</Typography>
                </div>
                <div className={clsx('flexRow', styles.row)}>
                    <Typography variant="subheading" weight="bold" className={styles.left}>Additional Server Names</Typography>
                    <Typography variant="body" className={styles.right}>-</Typography>
                </div>
                <div className={clsx('flexRow', styles.row)}>
                    <Typography variant="subheading" weight="bold" className={styles.left}>Template Set</Typography>
                    <Typography variant="body" className={styles.right}>{site.templateSet.value}</Typography>
                </div>
            </div>
            <Typography variant="title" weight="bold" className={styles.heading}>Languages</Typography>
            <div className="flexCol">
                <div className={clsx('flexRow', styles.row)}>
                    <Typography variant="caption" className={styles.left}>{t('properties.editLang')}</Typography>
                </div>
                <div className={clsx('flexRow', styles.row)}>
                    <Typography variant="subheading" weight="bold" className={styles.left}>Languages</Typography>
                    <div className={styles.right}>
                        {site.languages.map(l => (<Chip key={l.language} label={l.displayName} color="accent"/>))}
                    </div>
                </div>
                <div className={clsx('flexRow', styles.row)}>
                    <Typography variant="subheading" weight="bold" className={styles.left}>Mandatory languages</Typography>
                    <div className={styles.right}>
                        {mandatoryLanguages.length === 0 ? '-' : mandatoryLanguages}
                    </div>
                </div>
                <div className={clsx('flexRow', styles.row)}>
                    <Typography variant="subheading" weight="bold" className={styles.left}>Default language</Typography>
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
