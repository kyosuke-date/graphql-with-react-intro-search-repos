import React, { useState, useRef } from 'react';
import { ApolloProvider, Mutation, Query } from 'react-apollo';
import client from './Client';
import { ADD_STAR, REMOVE_STAR, SEARCH_REPOSITORIES } from './graphql';

const StarButton = ({ node, query, first, last, before, after }) => {
  const totalCount = node.stargazers.totalCount;
  const viewerHasStarred = node.viewerHasStarred;
  const starCount = totalCount === 1 ? "1 star" : `${totalCount} stars`
  const StarStatus = ({ addOrRemoveStar }) => {
    return (
      <button 
      onClick={
        () => {
          addOrRemoveStar({
            variables: { input: { starrableId: node.id }},
            update: (store, { data: { addStar, removeStar }}) => {
              const { starrable } = addStar || removeStar
              console.log(starrable);
              const data = store.readQuery({
                query: SEARCH_REPOSITORIES,
                variables: { query, first, last, before, after }
              })
              const edges = data.search.edges;
              const newEdges = edges.map(edge => {
                if(edge.node.id === node.id) {
                  const totalCount = edge.node.stargazers.totalCount;
                  const diff = starrable.viewerHasStarred ? 1 : -1;
                  const newTotalCount = totalCount + diff;
                  edge.node.stargazers.totalCount = newTotalCount;
                }
                return edge;
              })
              data.search.edges = newEdges;
              store.writeQuery({ query: SEARCH_REPOSITORIES, data });
            }
          })
        }
      }>
        {starCount} | {viewerHasStarred ? 'stared' : '-'}
      </button>
    )
  }
  return (
    <Mutation 
    mutation={viewerHasStarred ? REMOVE_STAR : ADD_STAR }
    >
      {
        addOrRemoveStar => <StarStatus addOrRemoveStar={addOrRemoveStar} />
      }
    </Mutation>
  )
}

const PER_PAGE = 5;
const DEFAULT_STATE = {
    first: PER_PAGE,
    after: null,
    last: null,
    before: null,
    query: ""
}

const App = () => {
  const [variables, setVariables] = useState(DEFAULT_STATE);
  const myRef = useRef(null);
  const { query, first, last, before, after } = variables;


  const handleSubmit = (e) => {
    e.preventDefault();
    setVariables({...variables, query: myRef.current.value})
    myRef.current.focus();
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
      <form onSubmit={handleSubmit}>
        {/* <input value={query} onChange={handleChange} /> */}
        <input ref={myRef} />
        <input type="submit" value="Submit" />
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
                          <StarButton node={node} {...{query, first, last, after, before}} />
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
