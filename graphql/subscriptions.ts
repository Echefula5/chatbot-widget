/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateDashboard = /* GraphQL */ `
  subscription OnCreateDashboard(
    $dashboardConfig: AWSJSON
    $id: ID
    $type: DashboardType
    $userId: ID
  ) {
    onCreateDashboard(
      dashboardConfig: $dashboardConfig
      id: $id
      type: $type
      userId: $userId
    ) {
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
export const onCreateInsight = /* GraphQL */ `
  subscription OnCreateInsight($data: AWSJSON, $id: ID, $type: String) {
    onCreateInsight(data: $data, id: $id, type: $type) {
      data
      id
      type
      __typename
    }
  }
`;
export const onCreateOrganization = /* GraphQL */ `
  subscription OnCreateOrganization(
    $description: String
    $id: ID
    $title: String
  ) {
    onCreateOrganization(description: $description, id: $id, title: $title) {
      description
      id
      title
      __typename
    }
  }
`;
export const onCreateUser = /* GraphQL */ `
  subscription OnCreateUser($cognitoId: String, $id: ID, $organizationId: ID) {
    onCreateUser(
      cognitoId: $cognitoId
      id: $id
      organizationId: $organizationId
    ) {
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
export const onDeleteDashboard = /* GraphQL */ `
  subscription OnDeleteDashboard($dashboardConfig: AWSJSON, $id: ID) {
    onDeleteDashboard(dashboardConfig: $dashboardConfig, id: $id) {
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
export const onDeleteInsight = /* GraphQL */ `
  subscription OnDeleteInsight($data: AWSJSON, $id: ID, $type: String) {
    onDeleteInsight(data: $data, id: $id, type: $type) {
      data
      id
      type
      __typename
    }
  }
`;
export const onDeleteOrganization = /* GraphQL */ `
  subscription OnDeleteOrganization(
    $description: String
    $id: ID
    $title: String
  ) {
    onDeleteOrganization(description: $description, id: $id, title: $title) {
      description
      id
      title
      __typename
    }
  }
`;
export const onDeleteUser = /* GraphQL */ `
  subscription OnDeleteUser($cognitoId: String, $id: ID, $organizationId: ID) {
    onDeleteUser(
      cognitoId: $cognitoId
      id: $id
      organizationId: $organizationId
    ) {
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
export const onUpdateDashboard = /* GraphQL */ `
  subscription OnUpdateDashboard(
    $dashboardConfig: AWSJSON
    $id: ID
    $type: DashboardType
    $userId: ID
  ) {
    onUpdateDashboard(
      dashboardConfig: $dashboardConfig
      id: $id
      type: $type
      userId: $userId
    ) {
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
export const onUpdateInsight = /* GraphQL */ `
  subscription OnUpdateInsight($data: AWSJSON, $id: ID, $type: String) {
    onUpdateInsight(data: $data, id: $id, type: $type) {
      data
      id
      type
      __typename
    }
  }
`;
export const onUpdateOrganization = /* GraphQL */ `
  subscription OnUpdateOrganization(
    $description: String
    $id: ID
    $title: String
  ) {
    onUpdateOrganization(description: $description, id: $id, title: $title) {
      description
      id
      title
      __typename
    }
  }
`;
export const onUpdateUser = /* GraphQL */ `
  subscription OnUpdateUser($cognitoId: String, $id: ID, $organizationId: ID) {
    onUpdateUser(
      cognitoId: $cognitoId
      id: $id
      organizationId: $organizationId
    ) {
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
export const onCreateDocument = /* GraphQL */ `
  subscription OnCreateDocument(
    $id: ID
    $title: String
    $s3Uri: String
    $type: String
    $content: AWSJSON
  ) {
    onCreateDocument(
      id: $id
      title: $title
      s3Uri: $s3Uri
      type: $type
      content: $content
    ) {
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
export const onUpdateDocument = /* GraphQL */ `
  subscription OnUpdateDocument(
    $id: ID
    $title: String
    $s3Uri: String
    $type: String
    $content: AWSJSON
  ) {
    onUpdateDocument(
      id: $id
      title: $title
      s3Uri: $s3Uri
      type: $type
      content: $content
    ) {
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
export const onDeleteDocument = /* GraphQL */ `
  subscription OnDeleteDocument(
    $id: ID
    $title: String
    $s3Uri: String
    $type: String
    $content: AWSJSON
  ) {
    onDeleteDocument(
      id: $id
      title: $title
      s3Uri: $s3Uri
      type: $type
      content: $content
    ) {
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
export const onCreateConversation = /* GraphQL */ `
  subscription OnCreateConversation(
    $id: ID
    $userId: ID
    $title: String
    $summary: String
    $createdAt: AWSDateTime
  ) {
    onCreateConversation(
      id: $id
      userId: $userId
      title: $title
      summary: $summary
      createdAt: $createdAt
    ) {
      id
      userId
      title
      summary
      createdAt
      __typename
    }
  }
`;
export const onUpdateConversation = /* GraphQL */ `
  subscription OnUpdateConversation(
    $id: ID
    $userId: ID
    $title: String
    $summary: String
    $createdAt: AWSDateTime
  ) {
    onUpdateConversation(
      id: $id
      userId: $userId
      title: $title
      summary: $summary
      createdAt: $createdAt
    ) {
      id
      userId
      title
      summary
      createdAt
      __typename
    }
  }
`;

export const onDeleteConversation = /* GraphQL */ `
  subscription OnDeleteConversation(
    $id: ID
    $userId: ID
    $title: String
    $summary: String
    $createdAt: AWSDateTime
  ) {
    onDeleteConversation(
      id: $id
      userId: $userId
      title: $title
      summary: $summary
      createdAt: $createdAt
    ) {
      id
      userId
      title
      summary
      createdAt
      __typename
    }
  }
`;
export const onCreateMessage = /* GraphQL */ `
  subscription OnCreateMessage(
    $id: ID
    $conversationId: ID
    $userId: ID
    $content: AWSJSON
    $supportingContent: AWSJSON
  ) {
    onCreateMessage(
      id: $id
      conversationId: $conversationId
      userId: $userId
      content: $content
      supportingContent: $supportingContent
    ) {
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

export const onUpdateMessage = /* GraphQL */ `
  subscription OnUpdateMessage(
    $id: ID
    $conversationId: ID
    $userId: ID
    $content: AWSJSON
    $supportingContent: AWSJSON
  ) {
    onUpdateMessage(
      id: $id
      conversationId: $conversationId
      userId: $userId
      content: $content
      supportingContent: $supportingContent
    ) {
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
export const onDeleteMessage = /* GraphQL */ `
  subscription OnDeleteMessage(
    $id: ID
    $conversationId: ID
    $userId: ID
    $content: AWSJSON
    $supportingContent: AWSJSON
  ) {
    onDeleteMessage(
      id: $id
      conversationId: $conversationId
      userId: $userId
      content: $content
      supportingContent: $supportingContent
    ) {
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
