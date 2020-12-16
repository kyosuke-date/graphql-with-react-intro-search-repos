import React, { useState } from 'react';
import { ApolloProvider } from 'react-apollo';
import { Query } from 'react-apollo';
import client from './Client';
import { SEARCH_REPOSITORIES } from './graphql';

const StarButton = ({ node }) => {
  const totalCount = node.stargazers.totalCount;
  const viewerHasStarred = node.viewerHasStarred;
  const starCount = totalCount === 1 ? "1 star" : `${totalCount} stars`
  return (
    <button>
      {starCount} | {viewerHasStarred ? 'stared' : '-'}
    </button>
  )
}

const PER_PAGE = 5;
const DEFAULT_STATE = {
    first: PER_PAGE,
    after: null,
    last: null,
    before: null,
    query: "フロントエンドエンジニア"
}

const App = () => {
  const [variables, setVariables] = useState(DEFAULT_STATE);
  const { query, first, last, before, after } = variables;

  const handleChange = (e) => {
    setVariables({
      ...DEFAULT_STATE,
      query: e.target.value
    })
  }

  const goNext = (search) => {
    setVariables({
      ...variables,
      first: PER_PAGE,
      after: search.pageInfo.endCursor,
      last: null,
      before: null
    })
  }
  const goPrevious = (search) => {
    setVariables({
      ...variables,
      first: null,
      after: null,
      last: PER_PAGE,
      before: search.pageInfo.startCursor
    })
  }

  return (
    <ApolloProvider client={client}>
      <form>
        <input value={query} onChange={handleChange} />
      </form>
      <Query 
      query={SEARCH_REPOSITORIES} 
      variables={{ query, first, last, before, after }}
      >
        {
          ({ loading, error, data }) => {
            if(loading) return 'Loading...';
            if(error) return `Error: ${error.message}`;

            const search = data.search;
            const repositoryCount = search.repositoryCount;
            const repositoryUnit = repositoryCount === 1 ? 'Repository' : 'Repositories';
            const title = `GitHub Repositoryies Seacrh Result - ${repositoryCount} ${repositoryUnit}`;
            return (
              <>
                <h2>{title}</h2>
                <ul>
                  {
                    search.edges.map((edge) => {
                      const node = edge.node
                      return (
                        <li key={node.id}>
                          <a href={node.url} target="_blank" rel="noreferrer">{node.name}</a>
                          &nbsp;
                          <StarButton node={node} />
                        </li>
                      )
                    })
                  }
                </ul>

                {
                  search.pageInfo.hasPreviousPage === true ?
                  <button onClick={() => goPrevious(search)}>Previous</button>
                  :
                  null
                }

                {
                  search.pageInfo.hasNextPage === true ? 
                <button onClick={() => goNext(search)}>Next</button>
                :
                null
                }
              </>
            )
          }
        }
      </Query>
    </ApolloProvider>
  );
}

export default App;
