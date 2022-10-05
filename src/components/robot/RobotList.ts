/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import Vue, { CreateElement, PropType, VNode } from 'vue';
import { BuildInput } from 'rapiq';
import { Robot, mergeDeep } from '@authelion/common';
import {
    ComponentListData,
    ComponentListHandlerMethodOptions,
    ComponentListMethods,
    ComponentListProperties,
    Pagination,
    PaginationMeta,
    buildListHeader,
    buildListItems,
    buildListNoMore,
    buildListPagination, buildListSearch,
} from '@vue-layout/utils';
import { useHTTPClient } from '../../utils';

export const RobotList = Vue.extend<
ComponentListData<Robot>,
ComponentListMethods<Robot>,
any,
ComponentListProperties<BuildInput<Robot>>
>({
    name: 'RobotList',
    components: { Pagination },
    props: {
        loadOnInit: {
            type: Boolean,
            default: true,
        },
        query: {
            type: Object as PropType<BuildInput<Robot>>,
            default() {
                return {};
            },
        },
        withHeader: {
            type: Boolean,
            default: true,
        },
        withNoMore: {
            type: Boolean,
            default: true,
        },
        withPagination: {
            type: Boolean,
            default: true,
        },
        withSearch: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            busy: false,
            items: [],
            q: '',
            meta: {
                limit: 10,
                offset: 0,
                total: 0,
            },
            itemBusy: false,
        };
    },
    watch: {
        q(val, oldVal) {
            if (val === oldVal) return;

            if (val.length === 1 && val.length > oldVal.length) {
                return;
            }

            this.meta.offset = 0;

            Promise.resolve()
                .then(this.load);
        },
    },
    created() {
        if (this.loadOnInit) {
            Promise.resolve()
                .then(this.load);
        }
    },
    methods: {
        async load(options?: PaginationMeta) {
            if (this.busy) return;

            if (options) {
                this.meta.offset = options.offset;
            }

            this.busy = true;

            try {
                const response = await useHTTPClient().robot.getMany(mergeDeep({
                    page: {
                        limit: this.meta.limit,
                        offset: this.meta.offset,
                    },
                    filter: {
                        name: this.q.length > 0 ? `~${this.q}` : this.q,
                    },
                }, this.query));

                this.items = response.data;
                const { total } = response.meta;
                this.meta.total = total;
            } catch (e) {
                if (e instanceof Error) {
                    this.$emit('failed', e);
                }
            }

            this.busy = false;
        },

        handleCreated(item: Robot, options?: ComponentListHandlerMethodOptions<Robot>) {
            options = options || {};

            const index = this.items.findIndex((el: Robot) => el.id === item.id);
            if (index === -1) {
                if (options?.unshift) {
                    this.items.unshift(item);
                } else {
                    this.items.push(item);
                }
            }
        },
        handleUpdated(item: Robot) {
            const index = this.items.findIndex((el: Robot) => el.id === item.id);
            if (index !== -1) {
                const keys : (keyof Robot)[] = Object.keys(item) as (keyof Robot)[];
                for (let i = 0; i < keys.length; i++) {
                    Vue.set(this.items[index], keys[i], item[keys[i]]);
                }
            }
        },
        handleDeleted(item: Robot) {
            const index = this.items.findIndex((el: Robot) => el.id === item.id);
            if (index !== -1) {
                this.items.splice(index, 1);
                this.meta.total--;
            }
        },
    },
    render(createElement: CreateElement): VNode {
        const header = buildListHeader(this, createElement, { titleText: 'Robots', iconClass: 'fa fa-robot' });
        const search = buildListSearch(this, createElement);
        const items = buildListItems(this, createElement, { itemIconClass: 'fa fa-robot' });
        const noMore = buildListNoMore(this, createElement, {
            text: 'No more robots available',
        });
        const pagination = buildListPagination(this, createElement);

        return createElement(
            'div',
            { staticClass: 'list' },
            [
                header,
                search,
                items,
                noMore,
                pagination,
            ],
        );
    },
});
