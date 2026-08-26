**Backend (packages/backend/src)**

- when updating an entity, send only changed fields. Example: if `moderation_state` has not changed, avoid to send it,
  otherwise we receive an error "422 - Unprocessable entity"
- check whether to manage "422 - Unprocessable entity" received from ATLAS
- 
