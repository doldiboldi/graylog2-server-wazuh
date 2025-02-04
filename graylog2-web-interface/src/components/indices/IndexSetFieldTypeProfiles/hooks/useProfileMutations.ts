/*
 * Copyright (C) 2020 Graylog, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Server Side Public License, version 1,
 * as published by MongoDB, Inc.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Server Side Public License for more details.
 *
 * You should have received a copy of the Server Side Public License
 * along with this program. If not, see
 * <http://www.mongodb.com/licensing/server-side-public-license>.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qualifyUrl } from 'util/URLUtils';
import fetch from 'logic/rest/FetchProvider';
import UserNotification from 'util/UserNotification';
import type {
  IndexSetFieldTypeProfile,
  IndexSetFieldTypeProfileJson,
} from 'components/indices/IndexSetFieldTypeProfiles/types';

export const urlPrefix = '/system/indices/index_sets/profiles';

const putProfile = async (profile: IndexSetFieldTypeProfile) => {
  const url = qualifyUrl(urlPrefix);
  const body: IndexSetFieldTypeProfileJson = {
    id: profile.id,
    name: profile.name,
    description: profile.description,
    custom_field_mappings: profile.customFieldMappings,
  };

  return fetch('PUT', url, body);
};

const postProfile = async (profile: IndexSetFieldTypeProfile) => {
  const url = qualifyUrl(urlPrefix);
  const body: IndexSetFieldTypeProfileJson = {
    name: profile.name,
    description: profile.description,
    custom_field_mappings: profile.customFieldMappings,
  };

  return fetch('POST', url, body);
};

const useProfileMutation = () => {
  const queryClient = useQueryClient();

  const post = useMutation(postProfile, {
    onError: (errorThrown) => {
      UserNotification.error(`Creating index set field type profile failed with status: ${errorThrown}`,
        'Could not create index set field type profile');
    },
    onSuccess: () => {
      UserNotification.success('Index set field type profile has been successfully created.', 'Success!');

      return queryClient.refetchQueries({ queryKey: ['indexSetFieldTypeProfiles'], type: 'active' });
    },
  });
  const put = useMutation(putProfile, {
    onError: (errorThrown) => {
      UserNotification.error(`Updating index set field type profile failed with status: ${errorThrown}`,
        'Could not update index set field type profile');
    },
    onSuccess: () => {
      UserNotification.success('Index set field type profile has been successfully updated.', 'Success!');

      return queryClient.refetchQueries({ queryKey: ['indexSetFieldTypeProfiles'], type: 'active' });
    },
  });

  return ({
    editProfile: put.mutateAsync,
    isEditLoading: put.isLoading,
    createProfile: post.mutateAsync,
    isCreateLoading: post.isLoading,
    isLoading: post.mutateAsync || post.isLoading,
  });
};

export default useProfileMutation;
