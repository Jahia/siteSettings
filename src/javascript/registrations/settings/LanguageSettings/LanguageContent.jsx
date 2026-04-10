import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import PropTypes from 'prop-types';
import {useMutation} from '@apollo/client';
import {
    Button,
    Delete,
    Edit,
    Menu,
    MenuItem,
    MoreVert,
    Paper,
    Pill,
    Star,
    Table,
    TableBody,
    TableBodyCell,
    TableHead,
    TableHeadCell,
    TableRow
} from '@jahia/moonstone';
import * as LanguageGraphQL from './Language.graphql';
import * as LanguageHelper from './LanguageHelper';

export const LanguageContent = ({site, uilang, openModal, siteLocales, defaultLanguage, refetch}) => {
    const {t} = useTranslation('siteSettings');

    const [menuOpen, setMenuOpen] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const closeMenu = () => {
        setMenuOpen(null);
        setAnchorEl(null);
    };

    const openMenu = (e, language) => {
        setMenuOpen(language);
        setAnchorEl(e.currentTarget);
    };

    const editLanguage = language => {
        if (language) {
            closeMenu();
        }

        openModal(language);
    };

    const getLanguageCount = l => siteLocales.find(lang => lang.language === l.language)?.count || 0;

    const [gqlSetDefaultLanguage] = useMutation(LanguageGraphQL.gqlSetDefaultLanguage);
    const [gqlDeleteLanguage] = useMutation(LanguageGraphQL.gqlSave);

    const setDefaultLanguage = language => {
        gqlSetDefaultLanguage({
            variables: {
                path: `/sites/${site}`,
                defaultLanguage: language
            }
        }).then(() => {
            closeMenu();
            refetch();
        });
    };

    const deleteLanguage = language => {
        gqlDeleteLanguage({
            variables: LanguageHelper.buildLanguageVariables(
                `/sites/${site}`,
                siteLocales.filter(l => l.language !== language))
        }).then(() => {
            closeMenu();
            refetch();
        });
    };

    const columnsWidth = {
        default: '5%',
        languages: '35%',
        availability: '45%'
    };

    return (
        <Paper>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableHeadCell width={columnsWidth.default}>{t('label.table.th.default')}</TableHeadCell>
                        <TableHeadCell width={columnsWidth.languages}>{t('label.table.th.languages')}</TableHeadCell>
                        <TableHeadCell
                            width={columnsWidth.availability}
                        >{t('label.table.th.availability')}
                        </TableHeadCell>
                        <TableHeadCell/>
                    </TableRow>
                </TableHead>
                <TableBody>{siteLocales.sort((a, b) => a.displayName.localeCompare(b.displayName))
                    .map(l => {
                        const languageCount = getLanguageCount(l);
                        const isDisabled = l.mandatory || l.activeInEdit || l.language === defaultLanguage || l.language === uilang || languageCount > 0;

                        return (
                            <TableRow key={l.language} onClick={e => e.stopPropagation()}>
                                <TableBodyCell width={columnsWidth.default}>{defaultLanguage === l.language ?
                                    <Star color="blue"/> : ''}
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
                                            onClick={e => openMenu(e, l.language)}/>
                                    <Menu isDisplayed={menuOpen === l.language}
                                          anchorEl={anchorEl}
                                          anchorPosition={{top: 0, left: 0}}
                                          anchorElOrigin={{vertical: 'bottom', horizontal: 'left'}}
                                          transformElOrigin={{vertical: 'top', horizontal: 'left'}}
                                          onClose={closeMenu}
                                    >
                                        <MenuItem label={t('label.actions.edit')}
                                                  iconStart={<Edit/>}
                                                  onClick={() => editLanguage(l)}/>
                                        <MenuItem label={t('label.table.actions.default.title')}
                                                  iconStart={<Star/>}
                                                  isDisabled={l.language === defaultLanguage}
                                                  onClick={() => {
                                                      if (l.language === defaultLanguage) {
                                                          // eslint-disable-next-line no-alert
                                                          alert(t('label.table.actions.default.error'));
                                                          closeMenu();
                                                      } else {
                                                          setDefaultLanguage(l.language);
                                                      }
                                                  }}/>
                                        <MenuItem label={t('label.table.actions.delete.title')}
                                                  iconStart={<Delete/>}
                                                  isDisabled={isDisabled}
                                                  onClick={() => {
                                                      if (isDisabled) {
                                                          let errorMessage = 'error';
                                                          if (l.mandatory) {
                                                              errorMessage = t('label.table.actions.delete.error.mandatory');
                                                          }

                                                          if (l.activeInEdit) {
                                                              errorMessage = t('label.table.actions.delete.error.activeInEdit');
                                                          }

                                                          if (languageCount > 0) {
                                                              errorMessage = t('label.table.actions.delete.error.language', {count: languageCount});
                                                          }

                                                          // eslint-disable-next-line no-alert
                                                          alert(errorMessage);
                                                          closeMenu();
                                                      } else {
                                                          deleteLanguage(l.language);
                                                      }
                                                  }}/>
                                    </Menu>
                                </TableBodyCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </Paper>
    );
};

LanguageContent.propTypes = {
    site: PropTypes.string.isRequired,
    uilang: PropTypes.string.isRequired,
    openModal: PropTypes.func.isRequired,
    siteLocales: PropTypes.array.isRequired,
    defaultLanguage: PropTypes.string.isRequired,
    refetch: PropTypes.func.isRequired
};
