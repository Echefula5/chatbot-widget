/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createDashboard = /* GraphQL */ `
  mutation CreateDashboard($input: CreateDashboardInput!) {
    createDashboard(input: $input) {
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
      userId {
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
      __typename
    }
  }
`;
export const createInsight = /* GraphQL */ `
  mutation CreateInsight($input: CreateInsightInput!) {
    createInsight(input: $input) {
      data
      id
      type
      __typename
    }
  }
`;
export const createOrganization = /* GraphQL */ `
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      description
      id
      title
      __typename
    }
  }
`;
export const createUser = /* GraphQL */ `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
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
export const deleteDashboard = /* GraphQL */ `
  mutation DeleteDashboard($input: DeleteDashboardInput!) {
    deleteDashboard(input: $input) {
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
      userId {
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
      __typename
    }
  }
`;
export const deleteInsight = /* GraphQL */ `
  mutation DeleteInsight($input: DeleteInsightInput!) {
    deleteInsight(input: $input) {
      data
      id
      type
      __typename
    }
  }
`;
export const deleteOrganization = /* GraphQL */ `
  mutation DeleteOrganization($input: DeleteOrganizationInput!) {
    deleteOrganization(input: $input) {
      description
      id
      title
      __typename
    }
  }
`;
export const deleteUser = /* GraphQL */ `
  mutation DeleteUser($input: DeleteUserInput!) {
    deleteUser(input: $input) {
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
export const updateDashboard = /* GraphQL */ `
  mutation UpdateDashboard($input: UpdateDashboardInput!) {
    updateDashboard(input: $input) {
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
      userId {
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
      __typename
    }
  }
`;
export const updateInsight = /* GraphQL */ `
  mutation UpdateInsight($input: UpdateInsightInput!) {
    updateInsight(input: $input) {
      data
      id
      type
      __typename
    }
  }
`;
export const updateOrganization = /* GraphQL */ `
  mutation UpdateOrganization($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      description
      id
      title
      __typename
    }
  }
`;
export const updateUser = /* GraphQL */ `
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
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
export const createDocument = /* GraphQL */ `
  mutation CreateDocument($input: CreateDocumentInput!) {
    createDocument(input: $input) {
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
export const updateDocument = /* GraphQL */ `
  mutation UpdateDocument($input: UpdateDocumentInput!) {
    updateDocument(input: $input) {
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
export const deleteDocument = /* GraphQL */ `
  mutation DeleteDocument($input: DeleteDocumentInput!) {
    deleteDocument(input: $input) {
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
export const createConversation = /* GraphQL */ `
  mutation CreateConversation($input: CreateConversationInput!) {
    createConversation(input: $input) {
      id
      userId
      title
      summary
      createdAt
      __typename
    }
  }
`;
export const updateConversation = /* GraphQL */ `
  mutation UpdateConversation($input: UpdateConversationInput!) {
    updateConversation(input: $input) {
      id
      userId
      title
      summary
      createdAt
      __typename
    }
  }
`;
export const deleteConversation = /* GraphQL */ `
  mutation DeleteConversation($input: DeleteConversationInput!) {
    deleteConversation(input: $input) {
      id
      userId
      title
      summary
      createdAt
      __typename
    }
  }
`;
export const createMessage = /* GraphQL */ `
  mutation CreateMessage($input: CreateMessageInput!) {
    createMessage(input: $input) {
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
export const updateMessage = /* GraphQL */ `
  mutation UpdateMessage($input: UpdateMessageInput!) {
    updateMessage(input: $input) {
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
export const deleteMessage = /* GraphQL */ `
  mutation DeleteMessage($input: DeleteMessageInput!) {
    deleteMessage(input: $input) {
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
export const sendUserMessage = /* GraphQL */ `
  mutation SendUserMessage($input: SendUserMessageInput!) {
    sendUserMessage(input: $input) {
      newConversation
      conversationId
      userId
      content
      instructions
      timestamp
      __typename
    }
  }
`;
export const sendUserMessage2 = /* GraphQL */ `
  mutation SendUserMessage2($input: SendUserMessageInput2!) {
    sendUserMessage2(input: $input) {
      prompt
      __typename
    }
  }
`;
