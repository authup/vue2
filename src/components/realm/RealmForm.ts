/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */
import {
    maxLength, minLength, required,
} from 'vuelidate/lib/validators';
import type { CreateElement, PropType, VNode } from 'vue';
import Vue from 'vue';
import type { Realm } from '@authup/core';
import { REALM_MASTER_NAME, createNanoID } from '@authup/core';
import type { ComponentFormData } from '@vue-layout/utils';
import {
    buildFormInput,
    buildFormSubmit,
    buildFormTextarea,
} from '@vue-layout/utils';
import { initPropertiesFromSource, useAPIClient } from '../../utils';
import { useAuthIlingo } from '../../language/singleton';
import { buildVuelidateTranslator } from '../../language/utils';

type Properties = {
    entity?: Realm,
    translatorLocale?: string
};

export const RealmForm = Vue.extend<
ComponentFormData<Realm>,
any,
any,
Properties
>({
    name: 'RealmForm',
    props: {
        entity: {
            type: Object as PropType<Realm>,
            required: false,
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
                maxLength: maxLength(128),
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
        isNameEmpty() {
            return !this.form.name || this.form.name.length === 0;
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
            if (this.entity) {
                initPropertiesFromSource<Realm>(this.entity, this.form);
            }

            if (this.form.name.length === 0) {
                this.generateName();
            }
        },
        async submit() {
            if (this.busy || this.$v.$invalid) {
                return;
            }

            this.busy = true;

            try {
                let response;
                if (this.isEditing) {
                    response = await useAPIClient().realm.update(this.entity.id, this.form);

                    this.$emit('updated', response);
                } else {
                    response = await useAPIClient().realm.create(this.form);

                    this.$emit('created', response);
                }
            } catch (e) {
                if (e instanceof Error) {
                    this.$emit('failed', e);
                }
            }

            this.busy = false;
        },

        generateName() {
            this.form.name = createNanoID();
        },
    },
    render(createElement: CreateElement): VNode {
        const vm = this;
        const h = createElement;

        const name = buildFormInput<Realm>(this, h, {
            validationTranslator: buildVuelidateTranslator(vm.translatorLocale),
            title: 'Name',
            propName: 'name',
            domProps: {
                disabled: vm.entity && vm.entity.name === REALM_MASTER_NAME,
            },
            attrs: {
                disabled: vm.entity && vm.entity.name === REALM_MASTER_NAME,
            },
        });

        const description = buildFormTextarea<Realm>(this, h, {
            validationTranslator: buildVuelidateTranslator(vm.translatorLocale),
            title: 'Description',
            propName: 'description',
            attrs: {
                rows: 4,
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
            h('hr'),
            description,
            h('hr'),
            submit,
        ]);
    },
});
