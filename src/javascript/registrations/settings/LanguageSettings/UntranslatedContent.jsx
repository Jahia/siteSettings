import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {gql, useMutation} from '@apollo/client';
import {
    Button,
    Edit,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Paper,
    RadioGroup,
    RadioItem,
    Typography
} from '@jahia/moonstone';
import styles from './LanguageSettings.scss';
import PropTypes from 'prop-types';

export const UntranslatedContent = ({site, value, refetch}) => {
    const {t} = useTranslation('siteSettings');

    const [modalOpen, setModalOpen] = useState(false);

    const [untranslatedValue, setUntranslatedValue] = useState(value);
    const [gqlSave] = useMutation(gql`mutation saveSiteLanguageOptions($path: String!, $mixLanguage: String!, $allowsUnlistedLanguages: String!) {
                jcr(workspace: EDIT) {
                    mutateNode(pathOrId: $path) {
                        mixLanguage: mutateProperty(name: "j:mixLanguage") {
                            setValue(value: $mixLanguage, type: BOOLEAN)
                        }
                        allowsUnlistedLanguages: mutateProperty(name: "j:allowsUnlistedLanguages") {
                            setValue(value: $allowsUnlistedLanguages, type: BOOLEAN)
                        }
                    }
                }
            }`);

    const save = () => {
        const options = {
            never: {mixLanguage: false, allowsUnlistedLanguages: false},
            only: {mixLanguage: true, allowsUnlistedLanguages: false},
            all: {mixLanguage: true, allowsUnlistedLanguages: true}
        };

        gqlSave({
            variables: {
                path: `/sites/${site}`,
                ...options[untranslatedValue]
            }
        }).then(() => {
            setModalOpen(false);
            refetch();
        });
    };

    return (
        <>
            <Modal isOpen={modalOpen} size="large">
                <ModalHeader title={t('label.unstranslatedContent.modal')}/>
                <ModalBody>
                    <Typography variant="heading">{t('label.unstranslatedContent.title')}</Typography>
                    <RadioGroup name="values"
                                className={styles.spacingSmall}
                                value={untranslatedValue}
                                onChange={(e, v) => setUntranslatedValue(v)}
                    >
                        <RadioItem id="never" label={t('label.unstranslatedContent.never')} value="never"/>
                        <RadioItem id="only" label={t('label.unstranslatedContent.only')} value="only"/>
                        <RadioItem id="all" label={t('label.unstranslatedContent.all')} value="all"/>
                    </RadioGroup>
                </ModalBody>
                <ModalFooter>
                    <Button size="big"
                            variant="ghost"
                            label={t('label.actions.cancel')}
                            onClick={() => setModalOpen(false)}/>
                    <Button size="big"
                            color="accent"
                            label={t('label.actions.save')}
                            data-sel-role="save"
                            onClick={() => save()}/>
                </ModalFooter>
            </Modal>

            <Paper>
                <Button variant="outlined"
                        color="accent"
                        icon={<Edit/>}
                        label={t('label.actions.edit')}
                        data-sel-role="edit"
                        className={styles.btnUntranslatedContent}
                        onClick={() => setModalOpen(true)}/>
                <Typography variant="heading">{t('label.unstranslatedContent.title')}</Typography>
                <div className={styles.spacingSmall}>
                    <Typography data-sel-role="unstranslatedContent-value"
                                data-value={value}
                    >{t(`label.unstranslatedContent.${value}`)}
                    </Typography>
                </div>
            </Paper>
        </>
    );
};

UntranslatedContent.propTypes = {
    site: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    refetch: PropTypes.func.isRequired
};
