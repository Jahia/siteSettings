import React from 'react';
import {useTranslation} from 'react-i18next';
import {gql, useMutation} from '@apollo/client';
import {
    Button,
    CheckboxGroup,
    CheckboxItem,
    Dropdown,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Pill,
    Typography
} from '@jahia/moonstone';
import styles from './LanguageSettings.scss';
import PropTypes from 'prop-types';

export const LanguageModal = ({
    site,
    selectedLanguage,
    setSelectedLanguage,
    isOpen,
    closeModal,
    refetch,
    availableLocales,
    siteLocales,
    defaultLanguage
}) => {
    const {t} = useTranslation('siteSettings');

    const onClose = () => {
        setSelectedLanguage({
            isNew: true,
            activeInEdit: false,
            activeInLive: false,
            mandatory: false
        });
        closeModal(null, false);
    };

    const [gqlSave] = useMutation(gql`mutation siteLanguages($path: String!, $defaultLanguage: String!, $languages: [String!]!, $mandatoryLanguages: [String!]!, $inactiveLanguages: [String!]!, $inactiveLiveLanguages: [String!]!) {
          jcr(workspace: EDIT) {
            mutateNode(pathOrId: $path) {
              defaultLanguage: mutateProperty(name: "j:defaultLanguage") {
                setValue(value: $defaultLanguage, type: STRING)
              }
              languages: mutateProperty(name: "j:languages") {
                setValues(values: $languages, type: STRING)
              }
              mandatoryLanguages: mutateProperty(name: "j:mandatoryLanguages") {
                setValues(values: $mandatoryLanguages, type: STRING)
              }
              inactiveLanguages: mutateProperty(name: "j:inactiveLanguages") {
                setValues(values: $inactiveLanguages, type: STRING)
              }
              inactiveLiveLanguages: mutateProperty(name: "j:inactiveLiveLanguages") {
                setValues(values: $inactiveLiveLanguages, type: STRING)
              }
            }
          }
        }`);

    const save = (l, addLanguage) => {
        if (addLanguage) {
            siteLocales = [...siteLocales, l];
        } else {
            siteLocales = siteLocales.map(lang => lang.language === l.language ? l : lang);
        }

        gqlSave({
            variables: {
                path: `/sites/${site}`,
                defaultLanguage,
                languages: siteLocales.filter(l => l.activeInEdit || l.activeInLive || l.defaultLanguage || l.mandatory).map(l => l.language),
                mandatoryLanguages: siteLocales.filter(l => l.mandatory).map(l => l.language),
                inactiveLanguages: siteLocales.filter(l => !l.activeInEdit).map(l => l.language),
                inactiveLiveLanguages: siteLocales.filter(l => !l.activeInLive).map(l => l.language)
            }
        }).then(() => {
            setSelectedLanguage({
                isNew: true,
                activeInEdit: false,
                activeInLive: false,
                mandatory: false
            });
            closeModal(l, addLanguage);
            refetch();
        });
    };

    return (
        <Modal isOpen={isOpen}>
            <ModalHeader
                title={t('label.modal.header', {action: selectedLanguage.language ? t('label.actions.edit') : t('label.actions.add')})}/>
            <ModalBody>
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
                              data={[
                                  {
                                      label: t('label.availability.inactive.title'),
                                      description: t('label.availability.inactive.description'),
                                      value: 'inactive',
                                      isDisabled: selectedLanguage.language === defaultLanguage
                                  },
                                  {
                                      label: t('label.availability.inactiveInLive.title'),
                                      description: t('label.availability.inactiveInLive.description'),
                                      value: 'inactiveInLive',
                                      isDisabled: selectedLanguage.language === defaultLanguage
                                  },
                                  {
                                      label: t('label.availability.active.title'),
                                      description: t('label.availability.active.description'),
                                      value: 'active'
                                  },
                                  {
                                      label: t('label.availability.required.title'),
                                      description: t('label.availability.required.description'),
                                      value: 'required'
                                  }
                              ]}
                              placeholder={t('label.modal.availability.placeholder')}
                              variant="outlined"
                              className={styles.dropdown}
                              value={selectedLanguage.activeInEdit && selectedLanguage.activeInLive && selectedLanguage.mandatory ? 'required' :
                                  selectedLanguage.activeInEdit && selectedLanguage.activeInLive ? 'active' :
                                      selectedLanguage.activeInEdit && !selectedLanguage.activeInLive ? 'inactiveInLive' : 'inactive'}
                              onChange={(e, v) => {
                                  switch (v.value) {
                                      case 'active':
                                          selectedLanguage.activeInEdit = true;
                                          selectedLanguage.activeInLive = true;
                                          selectedLanguage.mandatory = false;
                                          break;
                                      case 'inactiveInLive':
                                          selectedLanguage.activeInEdit = true;
                                          selectedLanguage.activeInLive = false;
                                          selectedLanguage.mandatory = false;
                                          break;
                                      case 'required':
                                          selectedLanguage.activeInEdit = true;
                                          selectedLanguage.activeInLive = true;
                                          selectedLanguage.mandatory = true;
                                          break;
                                      case 'inactive':
                                          selectedLanguage.activeInEdit = false;
                                          selectedLanguage.activeInLive = false;
                                          selectedLanguage.mandatory = false;
                                          break;
                                      default:
                                          break;
                                  }

                                  setSelectedLanguage({...selectedLanguage});
                              }}/>
                </div>
            </ModalBody>
            <ModalFooter>
                <Button size="big"
                        variant="ghost"
                        label={t('label.actions.cancel')}
                        data-sel-role="cancel"
                        onClick={() => onClose()}/>
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
                            onClick={() => save(selectedLanguage, false)}/>}
            </ModalFooter>
        </Modal>
    );
};

LanguageModal.propTypes = {
    site: PropTypes.string.isRequired,
    selectedLanguage: PropTypes.string.isRequired,
    setSelectedLanguage: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
    refetch: PropTypes.func.isRequired,
    availableLocales: PropTypes.array.isRequired,
    siteLocales: PropTypes.array.isRequired,
    defaultLanguage: PropTypes.string.isRequired
};
