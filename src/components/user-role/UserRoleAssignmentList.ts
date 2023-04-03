/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { CreateElement, VNode } from 'vue';
import Vue from 'vue';
import type { Role } from '@authup/core';
import { SlotName } from '@vue-layout/utils';
import { RoleList } from '../role';
import type { UserRoleListItemActionsProperties } from './UserRoleAssignmentListItemActions';
import { UserRoleAssignmentListItemActions } from './UserRoleAssignmentListItemActions';

export type Properties = {
    [key: string]: any;

    entityId: string
};

export const UserRoleAssignmentList = Vue.extend<any, any, any, Properties>({
    name: 'UserRoleAssignmentList',
    props: {
        entityId: String,
    },
    render(createElement: CreateElement): VNode {
        const vm = this;
        const h = createElement;

        const buildProps = (item: Role) : UserRoleListItemActionsProperties => ({
            userId: vm.entityId,
            roleId: item.id,
        });

        return h(RoleList, {
            scopedSlots: {
                [SlotName.ITEM_ACTIONS]: (slotProps) => h(UserRoleAssignmentListItemActions, {
                    props: buildProps(slotProps.item),
                }),
            },
        });
    },
});

export default UserRoleAssignmentList;
