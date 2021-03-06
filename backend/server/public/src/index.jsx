import { h, render } from 'preact';
import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { Provider, connect } from 'preact-redux';
import { createLogger } from 'redux-logger';
import { NEW_ADS, search, refresh, newSearch, deserialize, enableBatching } from 'utils.js';
import { debounce } from "lodash";
import { Filters, entities, targets, advertisers, filters } from 'filters.jsx';
import { go, t } from 'i18n.js';
import { Pagination, pagination } from 'pagination.js';

const ads = (state = [], action) => {
  switch(action.type) {
  case NEW_ADS:
    return action.value;
  default:
    return state;
  }
};

const reducer = enableBatching(combineReducers({
  ads,
  search,
  entities,
  advertisers,
  targets,
  filters,
  pagination
}));

const middleware = [thunkMiddleware, createLogger()];
const store = createStore(reducer, compose(applyMiddleware(...middleware)));

const Targeting = ({ targeting }) => (
  <div className="targeting_info">
    <div
      className="targeting"
      dangerouslySetInnerHTML={{__html:'<h3>Targeting Information</h3>' + targeting}} />
  </div>
);

const Ad = ({ ad }) => (
  <div>
    <div className="message">
      <div dangerouslySetInnerHTML={{__html: ad.html}} />
    </div>
    {ad.targeting !== null ? <Targeting targeting={ad.targeting} /> : ''}
  </div>
);

let Term = ({ search, term, dispatch }) => (
  <li>
    <button
      type="button"
      className={term === search ? "prefab current" : "prefab"}
      onClick={() => dispatch(newSearch(term)) }
      value={term}>{term}</button>
  </li>
);
Term = connect()(Term);

let App = ({ads, onKeyUp, search}) => (
  <div id="app">
    <p dangerouslySetInnerHTML={{__html: t("guff")}} />
    <form id="facebook-pac-browser" onSubmit={(e) => e.preventDefault()}>
      <fieldset className="prefabs">
        <legend>{t("search_terms")}</legend>
        <ul>
          {["Trump", "Obama", "Hillary", "Mueller", "Health", "Taxes"]
            .map((term) => <Term key={term} search={search} term={term} />)}
        </ul>
      </fieldset>
      <input type="search" id="search" placeholder={t("search")} onKeyUp={onKeyUp} value={search} />
      <Filters />
    </form>
    <div className="facebook-pac-ads">
      {ads.length > 0 ?
        <Pagination /> :
        <p className="no_ads">No results for your query.</p>}
      <div id="ads">
        {ads.map((ad) => <Ad ad={ad} key={ad.id} />)}
      </div>
      <Pagination />
    </div>
  </div>
);
App = connect(
  ({ ads, search }) => ({ ads, search }),
  (dispatch) => ({
    onKeyUp: debounce((e) => {
      e.preventDefault();
      dispatch(newSearch(e.target.value.length ? e.target.value : null));
    }, 750)
  })
)(App);

go(() => {
  render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.querySelector("#graphic")
  );

  deserialize(store.dispatch);
  refresh(store).then(() => store.subscribe(() => refresh(store)));
});
