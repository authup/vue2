/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { CreateElement, PropType, VNode } from 'vue';
import Vue from 'vue';
import { maxLength, minLength, required } from 'vuelidate/lib/validators';
import type { Permission } from '@authup/core';
import type { ComponentFormData } from '@vue-layout/utils';
import { buildFormInput, buildFormSubmit, buildFormTextarea } from '@vue-layout/utils';
import { initPropertiesFromSource, useAPIClient } from '../../utils';
import { useAuthIlingo } from '../../language/singleton';
import { buildVuelidateTranslator } from '../../language/utils';

type Properties = {
    [key: string]: any;

    entity?: Partial<Permission>,
    translatorLocale?: string
};

export const PermissionForm = Vue.extend<ComponentFormData<Permission>, any, any, Properties>({
    name: 'PermissionForm',
    props: {
        entity: {
            type: Object as PropType<Permission>,
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
        };
    },
    validations: {
        form: {
            name: {
                required,
                minLength: minLength(3),
                maxLength: maxLength(128),
            },
            description: {
                minLength: minLength(3),
                maxLength: maxLength(4096),
            },
        },
    },
    computed: {
        isEditing() {
            return this.entityProperty &&
                Object.prototype.hasOwnProperty.call(this.entityProperty, 'id');
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
                initPropertiesFromSource<Permission>(this.entity, this.form);
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
                    response = await useAPIClient().permission.update(this.entityProperty.id, this.form);
                    this.$emit('updated', response);
                } else {
                    response = await useAPIClient().permission.create(this.form);
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

        const name = buildFormInput(this, h, {
            validationTranslator: buildVuelidateTranslator(vm.translatorLocale),
            title: 'Name',
            propName: 'name',
        });

        const description = buildFormTextarea(this, h, {
            validationTranslator: buildVuelidateTranslator(vm.translatorLocale),
            title: 'Description',
            propName: 'description',
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
