/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const queryKnowledgeBase = /* GraphQL */ `
  query QueryKnowledgeBase(
    $comment: String!
    $messageVersion: Float!
    $agent: AgentInput!
    $inputText: String!
    $sessionId: String!
    $actionGroup: String!
    $function: String!
    $parameters: [ParameterInput!]!
  ) {
    queryKnowledgeBase(
      comment: $comment
      messageVersion: $messageVersion
      agent: $agent
      inputText: $inputText
      sessionId: $sessionId
      actionGroup: $actionGroup
      function: $function
      parameters: $parameters
    ) {
      messageVersion
      response {
        actionGroup
        function
        __typename
      }
      __typename
    }
  }
`;
export const getLambdaData = /* GraphQL */ `
  query GetLambdaData($prompt: String!) {
    getLambdaData(prompt: $prompt) {
      statusCode
      body
      __typename
    }
  }
`;
export const getUserProfile = /* GraphQL */ `
  query GetUserProfile($userId: String!) {
    getUserProfile(userId: $userId) {
      userId
      name
      dashboardId
      __typename
    }
  }
`;
export const listFeedback = /* GraphQL */ `
  query ListFeedback(
    $filter: TableFeedbackFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listFeedback(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        feedbackId
        userId
        content
        conversationId
        createdAt
        messageId
        modelId
        type
        __typename
      }
      nextToken
      __typename
    }
  }
`;

export const HbxlistFeedback = /* GraphQL */ `
  query HbxlistFeedback(
    $filter: HbxTableFeedbackFilterInput
    $limit: Int
    $nextToken: String
  ) {
    HbxlistFeedback(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        feedbackId
        userId
        content
        conversationId
        timestamp
        messageId
        feedback
        modelId
        type
        __typename
      }
      nextToken
      __typename
    }
  }
`;

export const askQuestionQuery = /* GraphQL */ `
  query AskQuestion($input: AskQuestionInput!) {
    askQuestion(input: $input) {
      success
      response
      confidence
      excerpts {
        text
        source_id
        relevance_score
      }
      intent_analysis {
        intent
        confidence
      }
      metadata {
        intent
        intent_confidence
        intent_analysis
        sentiment
        complexity_level
        confidence
        processing_time_ms
        session_id
        timestamp
        messageId
        enhancement_applied
        documents_found
        retrieved_docs {
          content
          score
          source
          location {
            type
          }
          metadata {
            x_amz_bedrock_kb_chunk_id
            x_amz_bedrock_kb_data_source_id
            x_amz_bedrock_kb_document_page_number
            x_amz_bedrock_kb_source_uri
          }
        }
        top_sources {
          source
          score
        }
        __typename
      }
      __typename
    }
  }
`;

export const batchGetInsights = /* GraphQL */ `
  query BatchGetInsights($ids: [ID!]!) {
    batchGetInsights(ids: $ids) {
      data
      id
      type
      __typename
    }
  }
`;
export const getDashboard = /* GraphQL */ `
  query GetDashboard($id: ID!) {
    getDashboard(id: $id) {
      dashboardConfig
      id
      insightIds
      insights {
        data
        id
        type
        __typename
      }
      type
      user {
        cognitoId
        id
        organizationId
        role
        __typename
      }
      userId {
        cognitoId
        id
        organizationId
        role
        __typename
      }
      __typename
    }
  }
`;
export const getDashboardByUserId = /* GraphQL */ `
  query GetDashboardByUserId($userId: ID!) {
    getDashboardByUserId(userId: $userId) {
      dashboardConfig
      id
      insightIds
      insights {
        data
        id
        type
        __typename
      }
      type
      user {
        cognitoId
        id
        organizationId
        role
        __typename
      }
      userId {
        cognitoId
        id
        organizationId
        role
        __typename
      }
      __typename
    }
  }
`;
export const getInsight = /* GraphQL */ `
  query GetInsight($id: ID!) {
    getInsight(id: $id) {
      data
      id
      type
      __typename
    }
  }
`;
export const getOrganization = /* GraphQL */ `
  query GetOrganization($id: ID!) {
    getOrganization(id: $id) {
      description
      id
      title
      __typename
    }
  }
`;
export const getUser = /* GraphQL */ `
  query GetUser($id: ID!) {
    getUser(id: $id) {
      cognitoId
      id
      organization {
        description
        id
        title
        __typename
      }
      organizationId
      role
      __typename
    }
  }
`;
export const listDashboards = /* GraphQL */ `
  query ListDashboards(
    $filter: TableDashboardFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listDashboards(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        dashboardConfig
        id
        insightIds
        type
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const listInsights = /* GraphQL */ `
  query ListInsights(
    $filter: TableInsightFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listInsights(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        data
        id
        type
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const listOrganizations = /* GraphQL */ `
  query ListOrganizations(
    $filter: TableOrganizationFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listOrganizations(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        description
        id
        title
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const listUsers = /* GraphQL */ `
  query ListUsers(
    $filter: TableUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        cognitoId
        id
        organizationId
        role
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getDocument = /* GraphQL */ `
  query GetDocument($id: ID!) {
    getDocument(id: $id) {
      id
      title
      s3Uri
      type
      content
      uploadedBy
      source
      uploadedAt
      insights
      __typename
    }
  }
`;
export const listDocuments = /* GraphQL */ `
  query ListDocuments(
    $filter: TableDocumentFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listDocuments(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        s3Uri
        type
        content
        uploadedBy
        source
        uploadedAt
        insights
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getConversation = /* GraphQL */ `
  query GetConversation($id: ID!) {
    getConversation(id: $id) {
      id
      userId
      title
      summary
      createdAt
      __typename
    }
  }
`;
export const listConversations = /* GraphQL */ `
  query ListConversations(
    $filter: TableConversationFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listConversations(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        title
        summary
        createdAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;

export const getMessage = /* GraphQL */ `
  query GetMessage($id: ID!, $timestamp: AWSDateTime) {
    getMessage(id: $id, timestamp: $timestamp) {
      id
      conversationId
      userId
      isBot
      content
      supportingContent
      citations
      explanation
      timestamp
      __typename
    }
  }
`;
export const listMessages = /* GraphQL */ `
  query ListMessages(
    $filter: TableMessageFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listMessages(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        conversationId
        userId
        isBot
        content
        supportingContent
        citations
        explanation
        timestamp
        __typename
      }
      nextToken
      __typename
    }
  }
`;
