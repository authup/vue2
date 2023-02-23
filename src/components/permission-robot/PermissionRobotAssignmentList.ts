/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { CreateElement, VNode } from 'vue';
import Vue from 'vue';
import type { Robot } from '@authup/common';
import { SlotName } from '@vue-layout/utils';
import type { RobotPermissionListItemActionsProperties } from '../robot-permission/RobotPermissionAssignmentListItemActions';
import {
    RobotPermissionAssignmentListItemActions,
} from '../robot-permission/RobotPermissionAssignmentListItemActions';
import { RobotList } from '../robot';

export type Properties = {
    entityId: string
};

export const PermissionRobotAssignmentList = Vue.extend<any, any, any, Properties>({
    name: 'PermissionRobotAssignmentList',
    props: {
        entityId: {
            type: String,
            required: true,
        },
    },
    render(createElement: CreateElement): VNode {
        const vm = this;
        const h = createElement;

        const buildProps = (item: Robot) : RobotPermissionListItemActionsProperties => ({
            permissionId: vm.entityId,
            robotId: item.id,
        });

        return h(RobotList, {
            scopedSlots: {
                [SlotName.ITEM_ACTIONS]: (slotProps) => h(RobotPermissionAssignmentListItemActions, {
                    props: buildProps(slotProps.item),
                }),
            },
        });
    },
});

export default PermissionRobotAssignmentList;
