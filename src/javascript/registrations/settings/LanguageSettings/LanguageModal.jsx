import React, {useMemo, useState} from 'react';
import PropTypes from 'prop-types';
import {useTranslation} from 'react-i18next';
import {useMutation} from '@apollo/client';
import {Button, CheckboxGroup, CheckboxItem, Dropdown, Modal, ModalBody, ModalFooter, ModalHeader, Pill, Typography} from '@jahia/moonstone';
import styles from './LanguageSettings.scss';
import * as LanguageGraphQL from './Language.gql-queries';
import * as LanguageHelper from './LanguageHelper';
import {LanguageModalError} from './LanguageModalError';

const emptyLanguage = Object.freeze({
    isNew: true,
    activeInEdit: false,
    activeInLive: false,
    mandatory: false
});
const availabilityFlags = {
    active: {activeInEdit: true, activeInLive: true, mandatory: false},
    inactiveInLive: {activeInEdit: true, activeInLive: false, mandatory: false},
    required: {activeInEdit: true, activeInLive: true, mandatory: true},
    inactive: {activeInEdit: false, activeInLive: false, mandatory: false}
};
const availabilityValues = ['inactive', 'inactiveInLive', 'active', 'required'];
const defaultDisabledValues = new Set(['inactive', 'inactiveInLive']);

export const LanguageModal = ({
    site,
    uilang,
    selectedLanguage,
    setSelectedLanguage,
    isOpen,
    closeModal,
    availableLocales,
    siteLocales,
    defaultLanguage
}) => {
    const {t} = useTranslation('siteSettings');

    const [modalErrorDescription, setModalErrorDescription] = useState(null);

    const onClose = () => {
        setSelectedLanguage(emptyLanguage);
        closeModal();
    };

    const availabilityData = useMemo(
        () => availabilityValues.map(value => ({
            value,
            label: t(`label.availability.${value}.title`),
            description: t(`label.availability.${value}.description`),
            isDisabled: defaultDisabledValues.has(value) && selectedLanguage.language === defaultLanguage
        })),
        [t, selectedLanguage.language, defaultLanguage]
    );

    const [gqlSaveSiteLanguages, {loading: isSavingSiteLanguages}] = useMutation(LanguageGraphQL.gqlSaveSiteLanguages,
        {
            refetchQueries: [{
                query: LanguageGraphQL.gqlGetSiteLanguages,
                variables: {path: `/sites/${site}`, displayLanguage: uilang}
            }],
            awaitRefetchQueries: true,
            onCompleted: () => onClose(),
            onError: err => {
                console.error(err);
                setModalErrorDescription(t('label.modal.error.description'));
            }
        });

    const save = (updatedLanguage, addLanguage) => {
        const updatedLocales = addLanguage ?
            [...siteLocales, updatedLanguage] :
            siteLocales.map(l => l.language === updatedLanguage.language ? updatedLanguage : l);

        gqlSaveSiteLanguages({variables: LanguageHelper.buildLanguageVariables(`/sites/${site}`, updatedLocales)});
    };

    return (
        <Modal isOpen={isOpen}>
            <ModalHeader
                title={t('label.modal.header', {action: selectedLanguage.language ? t('label.actions.edit') : t('label.actions.add')})}/>
            <ModalBody>
                <LanguageModalError isOpen={modalErrorDescription !== null}
                                    closeModal={() => setModalErrorDescription(null)}
                                    description={modalErrorDescription}/>
                <div className={styles.field}>
                    <Typography variant="subheading">{t('label.modal.language.title')}</Typography>
                    <Dropdown className={styles.dropdown}
                              placeholder={t('label.modal.language.placeholder')}
                              variant="outlined"
                              isDisabled={!selectedLanguage.isNew}
                              value={selectedLanguage.language}
                              data-sel-role="languages"
                              data={availableLocales.map(l => {
                                  return {
                                      iconEnd: <Pill label={l.language.toUpperCase()}/>,
                                      id: l.language,
                                      label: l.displayName,
                                      value: l.language,
                                      isDisabled: siteLocales.find(lang => lang.language === l.language)
                                  };
                              })}
                              onChange={(e, v) => setSelectedLanguage({
                                  ...selectedLanguage,
                                  language: v.value,
                                  displayName: v.label
                              })}/>
                </div>

                <div className={styles.field}>
                    <CheckboxGroup isReadOnly name="default">
                        <CheckboxItem id={defaultLanguage}
                                      label={t('label.modal.default')}
                                      checked={selectedLanguage.language === defaultLanguage}/>
                    </CheckboxGroup>
                </div>

                <div className={styles.field}>
                    <Typography variant="subheading">{t('label.modal.availability.title')}</Typography>
                    <Dropdown data-sel-role="availability"
                              data={availabilityData}
                              placeholder={t('label.modal.availability.placeholder')}
                              variant="outlined"
                              className={styles.dropdown}
                              data-value={LanguageHelper.getAvailability(selectedLanguage)}
                              value={LanguageHelper.getAvailability(selectedLanguage)}
                              onChange={(e, v) => {
                                  const flags = availabilityFlags[v.value];
                                  if (!flags) {
                                      return;
                                  }

                                  setSelectedLanguage({...selectedLanguage, ...flags});
                              }}/>
                </div>
            </ModalBody>
            <ModalFooter>
                <Button size="big"
                        variant="ghost"
                        label={t('label.actions.cancel')}
                        data-sel-role="cancel"
                        onClick={onClose}/>
                {selectedLanguage.isNew ?
                    <Button size="big"
                            color="accent"
                            label={t('label.actions.add')}
                            data-sel-role="add"
                            onClick={() => save(selectedLanguage, true)}/> :
                    <Button size="big"
                            color="accent"
                            label={t('label.actions.save')}
                            data-sel-role="save"
                            isDisabled={isSavingSiteLanguages}
                            onClick={() => save(selectedLanguage, false)}/>}
            </ModalFooter>
        </Modal>
    );
};

LanguageModal.propTypes = {
    site: PropTypes.string.isRequired,
    uilang: PropTypes.string.isRequired,
    selectedLanguage: PropTypes.shape({
        isNew: PropTypes.bool.isRequired,
        language: PropTypes.string, // Optional until selected
        displayName: PropTypes.string, // Optional until selected
        activeInEdit: PropTypes.bool.isRequired,
        activeInLive: PropTypes.bool.isRequired,
        mandatory: PropTypes.bool.isRequired
    }).isRequired,
    setSelectedLanguage: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
    availableLocales: PropTypes.arrayOf(PropTypes.shape({
        language: PropTypes.string.isRequired,
        displayName: PropTypes.string.isRequired
    })).isRequired,
    siteLocales: PropTypes.arrayOf(PropTypes.shape({
        language: PropTypes.string.isRequired,
        displayName: PropTypes.string.isRequired,
        activeInEdit: PropTypes.bool,
        activeInLive: PropTypes.bool,
        mandatory: PropTypes.bool,
        count: PropTypes.number
    })).isRequired,
    defaultLanguage: PropTypes.string // Can be undefined while loading
};
