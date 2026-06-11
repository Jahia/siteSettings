import React, {useContext} from 'react';
import * as PropTypes from 'prop-types';

export const LanguageSettingsContext = React.createContext({});

export const useLanguageSettingsContext = () => useContext(LanguageSettingsContext);

export const LanguageSettingsContextProvider = ({site, uilang, children}) => {
    return (
        <LanguageSettingsContext.Provider value={{site, uilang}}>
            {children}
        </LanguageSettingsContext.Provider>
    );
};

LanguageSettingsContextProvider.propTypes = {
    site: PropTypes.string.isRequired,
    uilang: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired
};
