import React, {useMemo, useState} from 'react';
import PropTypes from 'prop-types';
import {useTranslation} from 'react-i18next';
import {useMutation} from '@apollo/client';
import {Button, Delete, Edit, Menu, MenuItem, MoreVert, Paper, Pill, Star, Table, TableBody, TableBodyCell, TableHead, TableHeadCell, TableRow} from '@jahia/moonstone';
import * as LanguageGraphQL from './Language.gql-queries';
import * as LanguageHelper from './LanguageHelper';
import {LanguageModalError} from './LanguageModalError';
import {useLanguageSettingsContext} from './LanguageSettings.context';

const columnsWidth = {
    default: '5%',
    languages: '35%',
    availability: '45%'
};

export const LanguageContent = ({openModal, siteLocales, defaultLanguage}) => {
    const {t} = useTranslation('siteSettings');
    const {site, uilang} = useLanguageSettingsContext();

    const [menuState, setMenuState] = useState({anchorEl: null, row: null});
    const openMenu = (e, row) => setMenuState({anchorEl: e.currentTarget, row});
    const closeMenu = () => setMenuState(prev => ({...prev, anchorEl: null}));

    const [modalErrorDescription, setModalErrorDescription] = useState(null);
    const openModalError = description => {
        closeMenu();
        setModalErrorDescription(description);
    };

    const sortedLocales = useMemo(
        () => [...siteLocales].sort((a, b) => a.displayName.localeCompare(b.displayName)),
        [siteLocales]
    );

    const currentRow = menuState.row;
    const languageCount = currentRow?.count ?? 0;
    const isDisabled = currentRow?.mandatory || currentRow?.activeInEdit || currentRow?.language === defaultLanguage || currentRow?.language === uilang || languageCount > 0;

    const [gqlSetDefaultLanguage, {loading: isSavingDefaultLanguage}] = useMutation(LanguageGraphQL.gqlSetDefaultLanguage,
        {
            refetchQueries: [{
                query: LanguageGraphQL.gqlGetSiteLanguages,
                variables: {path: `/sites/${site}`, displayLanguage: uilang}
            }],
            awaitRefetchQueries: true,
            onCompleted: () => closeMenu(),
            onError: err => {
                console.error(err);
                closeMenu();
                setModalErrorDescription(t('label.modal.error.description'));
            }
        });
    const [gqlSaveSiteLanguages, {loading: isSavingSiteLanguages}] = useMutation(LanguageGraphQL.gqlSaveSiteLanguages,
        {
            refetchQueries: [{
                query: LanguageGraphQL.gqlGetSiteLanguages,
                variables: {path: `/sites/${site}`, displayLanguage: uilang}
            }],
            awaitRefetchQueries: true,
            onCompleted: () => closeMenu(),
            onError: err => {
                console.error(err);
                closeMenu();
                setModalErrorDescription(t('label.modal.error.description'));
            }
        });

    const setDefaultLanguage = language => {
        gqlSetDefaultLanguage({
            variables: {
                path: `/sites/${site}`,
                defaultLanguage: language
            }
        });
    };

    const deleteLanguage = language => {
        gqlSaveSiteLanguages({
            variables: LanguageHelper.buildLanguageVariables(
                `/sites/${site}`,
                sortedLocales.filter(l => l.language !== language))
        });
    };

    return (
        <>
            <LanguageModalError isOpen={modalErrorDescription !== null}
                                closeModal={() => setModalErrorDescription(null)}
                                description={modalErrorDescription}/>
            <Paper>
                <Menu
                    isDisplayed={Boolean(menuState.anchorEl)}
                    anchorEl={menuState.anchorEl}
                    anchorElOrigin={{vertical: 'bottom', horizontal: 'left'}}
                    transformElOrigin={{vertical: 'top', horizontal: 'left'}}
                    onClose={closeMenu}
                >
                    {currentRow && (
                        <>
                            <MenuItem label={t('label.actions.edit')}
                                      iconStart={<Edit/>}
                                      onClick={() => {
                                          closeMenu();
                                          openModal(currentRow);
                                      }}/>
                            <MenuItem label={t('label.table.actions.default.title')}
                                      iconStart={<Star/>}
                                      isDisabled={isSavingDefaultLanguage || currentRow.language === defaultLanguage}
                                      onClick={() => {
                                          if (currentRow.language === defaultLanguage) {
                                              openModalError(t('label.table.actions.default.error'));
                                          } else {
                                              setDefaultLanguage(currentRow.language);
                                          }
                                      }}/>
                            <MenuItem label={t('label.table.actions.delete.title')}
                                      iconStart={<Delete/>}
                                      isDisabled={isSavingSiteLanguages || isDisabled}
                                      onClick={() => {
                                          if (isDisabled) {
                                              let errorMessage = 'error';
                                              if (currentRow.language === defaultLanguage) {
                                                  errorMessage = t('label.table.actions.delete.error.default');
                                              } else if (currentRow.mandatory) {
                                                  errorMessage = t('label.table.actions.delete.error.mandatory');
                                              } else if (currentRow.activeInEdit) {
                                                  errorMessage = t('label.table.actions.delete.error.activeInEdit');
                                              } else if (languageCount > 0) {
                                                  errorMessage = t('label.table.actions.delete.error.language', {count: languageCount});
                                              }

                                              openModalError(errorMessage);
                                          } else {
                                              deleteLanguage(currentRow.language);
                                          }
                                      }}/>
                        </>
                    )}
                </Menu>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableHeadCell width={columnsWidth.default}>{t('label.table.th.default')}</TableHeadCell>
                            <TableHeadCell width={columnsWidth.languages}>{t('label.table.th.languages')}</TableHeadCell>
                            <TableHeadCell width={columnsWidth.availability}>{t('label.table.th.availability')}</TableHeadCell>
                            <TableHeadCell/>
                        </TableRow>
                    </TableHead>
                    <TableBody>{sortedLocales.map(l => (
                        <TableRow key={l.language} onClick={e => e.stopPropagation()}>
                            <TableBodyCell width={columnsWidth.default}>
                                {defaultLanguage === l.language ? <Star color="blue"/> : ''}
                            </TableBodyCell>
                            <TableBodyCell width={columnsWidth.languages}>
                                {l.displayName} <Pill label={l.language}/>
                            </TableBodyCell>
                            <TableBodyCell width={columnsWidth.availability}>
                                {t(`label.availability.${LanguageHelper.getAvailability(l)}.title`)}
                            </TableBodyCell>
                            <TableBodyCell align="right">
                                <Button size="big"
                                        variant="ghost"
                                        icon={<MoreVert/>}
                                        aria-label={t('label.actions.moreFor', {language: l.displayName})}
                                        onClick={e => openMenu(e, l)}/>
                            </TableBodyCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </Paper>
        </>
    );
};

LanguageContent.propTypes = {
    openModal: PropTypes.func.isRequired,
    siteLocales: PropTypes.array.isRequired,
    defaultLanguage: PropTypes.string
};
