import React from 'react';
import {useTranslation} from 'react-i18next';
import PropTypes from 'prop-types';
import {Button, Modal, ModalBody, ModalFooter, ModalHeader, Typography} from '@jahia/moonstone';

export const LanguageModalError = ({isOpen, closeModal, description}) => {
    const {t} = useTranslation('siteSettings');

    return (
        <Modal isOpen={isOpen} size="large">
            <ModalHeader title={t('label.modal.error.title')}/>
            <ModalBody>
                <Typography variant="body">{description}</Typography>
            </ModalBody>
            <ModalFooter>
                <Button size="big"
                        variant="ghost"
                        label={t('label.actions.close')}
                        onClick={closeModal}/>
            </ModalFooter>
        </Modal>
    );
};

LanguageModalError.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
    description: PropTypes.string
};
