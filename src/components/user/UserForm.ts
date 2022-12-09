/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {
    email, maxLength, minLength, required,
} from 'vuelidate/lib/validators';
import Vue, {
    CreateElement, PropType, VNode, VNodeData,
} from 'vue';

import { Realm, User } from '@authup/common';
import {
    ComponentFormData, ComponentFormMethods,
    ComponentListItemSlotProps, SlotName, buildFormInput, buildFormSubmit, buildListItemToggleAction,
} from '@vue-layout/utils';
import { useHTTPClient } from '../../utils';
import { initPropertiesFromSource } from '../../utils/proprety';
import { useAuthIlingo } from '../../language/singleton';
import { buildVuelidateTranslator } from '../../language/utils';
import { RealmList } from '../realm';

export type Properties = {
    [key: string]: any;

    entity?: Partial<User>,
    realmId?: string,
    translatorLocale?: string
};

type Data = {
    displayNameChanged: boolean,
} & ComponentFormData<User>;

export const UserForm = Vue.extend<Data, ComponentFormMethods<User>, any, Properties>({
    name: 'UserForm',
    props: {
        entity: {
            type: Object as PropType<Partial<User>>,
            default: undefined,
        },
        realmId: {
            type: String,
            default: undefined,
        },
        canManage: {
            type: Boolean,
            default: true,
        },
        translatorLocale: {
            type: String,
            default: undefined,
        },
    },
    data() {
        return {
            form: {
                active: true,
                name: '',
                display_name: '',
                email: '',
                realm_id: '',
            },

            busy: false,

            displayNameChanged: false,
        };
    },
    validations: {
        form: {
            name: {
                required,
                minLength: minLength(3),
                maxLength: maxLength(128),
            },
            display_name: {
                required,
                minLength: minLength(3),
                maxLength: maxLength(128),
            },
            email: {
                minLength: minLength(5),
                maxLength: maxLength(255),
                email,
            },
            realm_id: {
                required,
            },
        },
    },
    computed: {
        isRealmLocked() {
            return !!this.realmId;
        },
        isEditing() {
            return typeof this.entity !== 'undefined' &&
                Object.prototype.hasOwnProperty.call(this.entity, 'id');
        },
        isNameLocked() {
            if (!this.entity) {
                return false;
            }

            return !!this.entity.name_locked;
        },
        updatedAt() {
            return this.entity ? this.entity.updated_at : undefined;
        },
    },
    watch: {
        updatedAt(val, oldVal) {
            if (val && val !== oldVal) {
                this.initFromProperties();
            }
        },
    },
    created() {
        this.initFromProperties();
    },
    methods: {
        initFromProperties() {
            if (this.realmId) {
                this.form.realm_id = this.realmId;
            }

            if (this.entity) {
                initPropertiesFromSource<User>(this.entity, this.form);
            }
        },
        getModifiedFields() {
            if (typeof this.entity === 'undefined') {
                return Object.keys(this.form);
            }

            const fields : (keyof User)[] = [];

            const keys : (keyof User)[] = Object.keys(this.form) as (keyof User)[];

            for (let i = 0; i < keys.length; i++) {
                if (
                    Object.prototype.hasOwnProperty.call(this.form, keys[i]) &&
                    this.entity[keys[i]] !== this.form[keys[i]]
                ) {
                    fields.push(keys[i]);
                }
            }

            return fields;
        },
        async submit() {
            if (this.busy) {
                return;
            }

            this.busy = true;

            try {
                const fields = this.getModifiedFields();

                if (fields.length > 0) {
                    const properties : Record<string, any> = {};

                    for (let i = 0; i < fields.length; i++) {
                        properties[fields[i]] = this.form[fields[i]];
                    }

                    if (this.isEditing) {
                        const user = await useHTTPClient().user.update(this.entity.id, { ...properties });

                        this.$emit('updated', user);
                    } else {
                        const user = await useHTTPClient().user.create(properties);

                        this.$emit('created', user);
                    }
                }
            } catch (e) {
                if (e instanceof Error) {
                    this.$emit('failed', e);
                }
            }

            this.busy = false;
        },
        updateDisplayName(value: string) {
            if (!this.displayNameChanged) {
                this.form.display_name = value;
            }
        },
        handleDisplayNameChanged(value: string) {
            this.displayNameChanged = value.length !== 0;
        },
    },
    render(createElement: CreateElement): VNode {
        const vm = this;
        const h = createElement;

        const name = buildFormInput<User>(vm, h, {
            validationTranslator: buildVuelidateTranslator(vm.translatorLocale),
            title: 'Name',
            propName: 'name',
            attrs: {
                disabled: vm.isNameLocked,
            },
            domProps: {
                disabled: vm.isNameLocked,
            },
            changeCallback(input) {
                vm.updateDisplayName.call(null, input);
            },
        });

        const displayName = buildFormInput<User>(vm, h, {
            validationTranslator: buildVuelidateTranslator(vm.translatorLocale),
            title: 'Display Name',
            propName: 'display_name',
            changeCallback(input) {
                vm.handleDisplayNameChanged.call(null, input);
            },
        });

        const email = buildFormInput<User>(vm, h, {
            validationTranslator: buildVuelidateTranslator(vm.translatorLocale),
            title: 'Email',
            propName: 'email',
            attrs: {
                type: 'email',
                placeholder: '...@...',
            },
        });

        let activate = h();

        if (vm.canManage) {
            activate = h('div', {
                staticClass: 'form-group mb-3',
            }, [
                h('b-form-checkbox', {
                    attrs: {
                        switch: '',
                    },
                    model: {
                        value: vm.form.active,
                        callback(v: boolean) {
                            vm.form.active = v;
                        },
                        expression: 'form.active',
                    },
                } as VNodeData, [
                    h('span', {
                        class: {
                            'text-warning': !vm.form.active,
                            'text-success': vm.form.active,
                        },
                    }, [vm.form.active ? 'active' : 'inactive']),
                ]),
            ]);
        }

        const submit = buildFormSubmit(this, h, {
            updateText: useAuthIlingo().getSync('form.update.button', vm.translatorLocale),
            createText: useAuthIlingo().getSync('form.create.button', vm.translatorLocale),
        });

        const leftColumn = h('div', { staticClass: 'col' }, [
            name,
            displayName,
            email,
            activate,
            h('hr'),
            submit,
        ]);

        let rightColumn = h();
        if (
            !vm.isRealmLocked &&
            vm.canManage
        ) {
            const realm = h(RealmList, {
                scopedSlots: {
                    [SlotName.ITEM_ACTIONS]: (
                        props: ComponentListItemSlotProps<Realm>,
                    ) => buildListItemToggleAction(vm.form, h, {
                        propName: 'realm_id',
                        item: props.item,
                        busy: props.busy,
                    }),
                },
            });

            rightColumn = h('div', {
                staticClass: 'col',
            }, [
                realm,
            ]);
        }

        return h('form', {
            on: {
                submit($event: any) {
                    $event.preventDefault();

                    return vm.submit.apply(null);
                },
            },
        }, [
            h('div', { staticClass: 'row' }, [
                leftColumn,
                rightColumn,
            ]),
        ]);
    },
});

export default UserForm;
