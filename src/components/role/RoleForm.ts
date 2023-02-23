/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { CreateElement, PropType, VNode } from 'vue';
import Vue from 'vue';
import { maxLength, minLength, required } from 'vuelidate/lib/validators';
import type { Role } from '@authup/common';
import type { ComponentFormData, ComponentFormMethods } from '@vue-layout/utils';
import { buildFormInput, buildFormSubmit, buildFormTextarea } from '@vue-layout/utils';
import { useHTTPClient } from '../../utils';
import { initPropertiesFromSource } from '../../utils/proprety';
import { useAuthIlingo } from '../../language/singleton';
import { buildVuelidateTranslator } from '../../language/utils';

type Properties = {
    entity?: Partial<Role>,
    translatorLocale?: string
};

export const RoleForm = Vue.extend<
ComponentFormData<Role>,
ComponentFormMethods<Role>,
any,
Properties
>({
    name: 'RoleForm',
    props: {
        entity: {
            type: Object as PropType<Role>,
            default: undefined,
        },
        translatorLocale: {
            type: String,
            default: undefined,
        },
    },
    data() {
        return {
            form: {
                name: '',
                description: '',
            },

            busy: false,
            message: null,
        };
    },
    validations: {
        form: {
            name: {
                required,
                minLength: minLength(3),
                maxLength: maxLength(30),
            },
            description: {
                minLength: minLength(5),
                maxLength: maxLength(4096),
            },
        },
    },
    computed: {
        isEditing() {
            return this.entity &&
                Object.prototype.hasOwnProperty.call(this.entity, 'id');
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
        Promise.resolve()
            .then(this.initFromProperties);
    },
    methods: {
        initFromProperties() {
            if (this.entity) {
                initPropertiesFromSource<Role>(this.entity, this.form);
            }
        },
        async submit() {
            if (this.busy || this.$v.$invalid) {
                return;
            }

            this.message = null;
            this.busy = true;

            try {
                let response;

                if (this.isEditing) {
                    response = await useHTTPClient().role.update(this.entity.id, this.form);

                    this.$emit('updated', response);
                } else {
                    response = await useHTTPClient().role.create(this.form);

                    this.$emit('created', response);
                }
            } catch (e) {
                if (e instanceof Error) {
                    this.$emit('failed', e);
                }
            }

            this.busy = false;
        },
    },
    render(createElement: CreateElement): VNode {
        const vm = this;
        const h = createElement;

        const name = buildFormInput<Role>(this, h, {
            validationTranslator: buildVuelidateTranslator(vm.translatorLocale),
            title: 'Name',
            propName: 'name',
        });

        const description = buildFormTextarea<Role>(vm, h, {
            validationTranslator: buildVuelidateTranslator(vm.translatorLocale),
            title: 'Description',
            propName: 'description',
            attrs: {
                rows: 6,
            },
        });

        const submit = buildFormSubmit(this, h, {
            updateText: useAuthIlingo().getSync('form.update.button', vm.translatorLocale),
            createText: useAuthIlingo().getSync('form.create.button', vm.translatorLocale),
        });

        return h('form', {
            on: {
                submit($event: any) {
                    $event.preventDefault();

                    return vm.submit.apply(null);
                },
            },
        }, [
            name,
            description,
            submit,
        ]);
    },
});

export default RoleForm;
