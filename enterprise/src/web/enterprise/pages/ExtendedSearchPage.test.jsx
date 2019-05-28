// @flow strict
import React from 'react';
import Immutable from 'immutable';
import { mount } from 'enzyme';

// $FlowFixMe: imports from core need to be fixed in flow
import mockComponent from 'helpers/mocking/MockComponent';
import { StreamsActions } from 'enterprise/stores/StreamsStore';
import { WidgetStore } from 'enterprise/stores/WidgetStore';
import { QueryFiltersStore } from 'enterprise/stores/QueryFiltersStore';
import SearchActions from 'enterprise/actions/SearchActions';
import { SearchExecutionStateStore } from 'enterprise/stores/SearchExecutionStateStore';
import { SearchConfigActions } from 'enterprise/stores/SearchConfigStore';
import { ViewActions, ViewStore } from 'enterprise/stores/ViewStore';
import { FieldTypesActions } from 'enterprise/stores/FieldTypesStore';
import { SearchMetadataActions, SearchMetadataStore } from 'enterprise/stores/SearchMetadataStore';
import SearchExecutionState from 'enterprise/logic/search/SearchExecutionState';
import View from 'enterprise/logic/views/View';

import ExtendedSearchPage from './ExtendedSearchPage';

jest.mock('enterprise/components/QueryBar', () => mockComponent('QueryBar'));
jest.mock('enterprise/components/SearchResult', () => mockComponent('SearchResult'));
jest.mock('enterprise/stores/StreamsStore', () => ({ StreamsActions: { refresh: jest.fn() } }));
jest.mock('enterprise/components/common/WindowLeaveMessage', () => mockComponent('WindowLeaveMessage'));
jest.mock('stores/connect', () => x => x);
jest.mock('enterprise/components/SearchBarWithStatus', () => mockComponent('SearchBar'));
jest.mock('enterprise/stores/SearchConfigStore', () => ({ SearchConfigStore: {}, SearchConfigActions: {} }));
jest.mock('enterprise/stores/FieldTypesStore', () => ({ FieldTypesActions: {} }));
jest.mock('enterprise/stores/SearchMetadataStore', () => ({ SearchMetadataActions: {}, SearchMetadataStore: {} }));
jest.mock('enterprise/logic/withPluginEntities', () => x => x);

describe('ExtendedSearchPage', () => {
  beforeEach(() => {
    WidgetStore.listen = jest.fn(() => jest.fn());
    QueryFiltersStore.listen = jest.fn(() => jest.fn());
    // $FlowFixMe: Exact promise type not required for test functionality
    SearchActions.execute = jest.fn(() => ({ then: fn => fn() }));
    StreamsActions.refresh = jest.fn();
    SearchConfigActions.refresh = jest.fn();
    SearchExecutionStateStore.listen = jest.fn(() => jest.fn());
    ViewActions.search.completed.listen = jest.fn(() => jest.fn());
    ViewStore.getInitialState = jest.fn(() => ({ view: View.create(), dirty: false, activeQuery: 'foobar' }));
    FieldTypesActions.all = jest.fn();
    SearchMetadataActions.parseSearch = jest.fn();
    SearchMetadataStore.listen = jest.fn(() => jest.fn());
    SearchActions.refresh = jest.fn(() => Promise.resolve());
    SearchActions.refresh.listen = jest.fn(() => jest.fn());

    const searchMetadata = { undeclared: Immutable.Set() };
    SearchMetadataActions.parseSearch.mockReturnValue({ then: x => x(searchMetadata) });
  });

  const SimpleExtendedSearchPage = props => (
    <ExtendedSearchPage route={{}}
                        executionState={SearchExecutionState.empty()}
                        headerElements={[]}
                        searchRefreshHooks={[]}
                        queryBarElements={[]}
                        {...props} />
  );

  it('register a WindowLeaveMessage', () => {
    const wrapper = mount(<SimpleExtendedSearchPage />);

    expect(wrapper.find('WindowLeaveMessage')).toHaveLength(1);
  });
  it('passes the given route to the WindowLeaveMessage component', () => {
    const route = { path: '/foo' };
    const wrapper = mount(<SimpleExtendedSearchPage route={route} />);

    const windowLeaveMessage = wrapper.find('WindowLeaveMessage');
    expect(windowLeaveMessage).toHaveLength(1);
    expect(windowLeaveMessage).toHaveProp('route', route);
  });

  it('executes search upon mount', () => {
    mount(<SimpleExtendedSearchPage />);

    expect(SearchActions.execute).toHaveBeenCalled();
  });

  it('refreshes search config upon mount', () => {
    mount(<SimpleExtendedSearchPage />);

    expect(SearchConfigActions.refresh).toHaveBeenCalled();
  });

  it('does not register to WidgetStore upon mount', () => {
    mount(<SimpleExtendedSearchPage />);

    expect(WidgetStore.listen).not.toHaveBeenCalled();
  });
  it('does not unregister from Widget store upon unmount', () => {
    const unsubscribe = jest.fn();
    WidgetStore.listen = jest.fn(() => unsubscribe);
    const wrapper = mount(<SimpleExtendedSearchPage />);

    wrapper.unmount();
    expect(unsubscribe).not.toHaveBeenCalled();
  });
  it('does not register to QueryFiltersStore upon mount', () => {
    mount(<SimpleExtendedSearchPage />);

    expect(QueryFiltersStore.listen).not.toHaveBeenCalled();
  });
  it('does not unregister from Query Filter store upon unmount', () => {
    const unsubscribe = jest.fn();
    QueryFiltersStore.listen = jest.fn(() => unsubscribe);
    const wrapper = mount(<SimpleExtendedSearchPage />);

    wrapper.unmount();
    expect(unsubscribe).not.toHaveBeenCalled();
  });
  it('registers to SearchActions.refresh upon mount', () => {
    mount(<SimpleExtendedSearchPage />);

    expect(SearchActions.refresh.listen).toHaveBeenCalled();
  });
  it('registers to ViewActions.search.completed upon mount', () => {
    mount(<SimpleExtendedSearchPage />);

    expect(ViewActions.search.completed.listen).toHaveBeenCalled();
  });
  it('unregisters from ViewActions.search.completed upon unmount', () => {
    const unsubscribe = jest.fn();
    ViewActions.search.completed.listen = jest.fn(() => unsubscribe);
    const wrapper = mount(<SimpleExtendedSearchPage />);

    expect(unsubscribe).not.toHaveBeenCalled();
    wrapper.unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
  it('refreshes Streams upon mount', () => {
    mount(<SimpleExtendedSearchPage />);

    expect(StreamsActions.refresh).toHaveBeenCalled();
  });
  it('updating search in view triggers search execution', () => {
    mount(<SimpleExtendedSearchPage />);

    const cb = ViewActions.search.completed.listen.mock.calls[0][0];
    SearchActions.execute.mockClear();
    expect(SearchActions.execute).not.toHaveBeenCalled();

    return cb({ search: {} })
      .then(() => {
        expect(SearchActions.execute).toHaveBeenCalled();
      });
  });
  it('refreshes field types store upon mount', () => {
    expect(FieldTypesActions.all).not.toHaveBeenCalled();
    mount(<SimpleExtendedSearchPage />);
    expect(FieldTypesActions.all).toHaveBeenCalled();
  });
  it('refreshes field types upon every search execution', () => {
    mount(<SimpleExtendedSearchPage />);

    FieldTypesActions.all.mockClear();
    const cb = ViewActions.search.completed.listen.mock.calls[0][0];
    return cb({ search: {} })
      .then(() => {
        expect(FieldTypesActions.all).toHaveBeenCalled();
      });
  });

  it('refreshing after query change parses search metadata first', (done) => {
    const wrapper = mount(<SimpleExtendedSearchPage />);

    const searchBar = wrapper.find('SearchBar');
    const cb = searchBar.at(0).props().onExecute;

    const view = { search: {} };

    const promise = cb(view);

    promise.then(() => {
      expect(SearchMetadataActions.parseSearch).toHaveBeenCalled();
      expect(SearchActions.execute).toHaveBeenCalled();
      done();
    });
  });

  it('changing current query in view does not trigger search execution', () => {
    mount(<SimpleExtendedSearchPage />);

    SearchActions.execute.mockClear();
    expect(SearchActions.execute).not.toHaveBeenCalled();

    return ViewActions.selectQuery('someQuery')
      .then(() => {
        expect(SearchActions.execute).not.toHaveBeenCalled();
      });
  });
});
