/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {
    maxLength, minLength, required, sameAs,
} from 'vuelidate/lib/validators';
import type {
    CreateElement, VNode, VNodeData,
} from 'vue';
import Vue from 'vue';
import type { User } from '@authup/common';
import type { ComponentFormData } from '@vue-layout/utils';
import { buildFormInput, buildFormSubmit } from '@vue-layout/utils';
import { useHTTPClient } from '../../utils';
import { useAuthIlingo } from '../../language/singleton';
import { buildVuelidateTranslator } from '../../language/utils';

type Properties = {
    [key: string]: any;

    id: User['id'],
    translatorLocale?: string
};

export const UserPasswordForm = Vue.extend<ComponentFormData<User>, any, any, Properties>({
    name: 'UserPasswordForm',
    props: {
        id: {
            type: String,
            required: true,
        },
        translatorLocale: {
            type: String,
            default: undefined,
        },
    },
    data() {
        return {
            form: {
                password: '',
                password_repeat: '',
                passwordShow: false,
            },

            message: null,
            busy: false,
        };
    },
    validations: {
        form: {
            password: {
                required,
                minLength: minLength(5),
                maxLength: maxLength(100),
            },
            password_repeat: {
                minLength: minLength(5),
                maxLength: maxLength(100),
                sameAs: sameAs('password'),
            },
        },
    },
    computed: {
        isEditing() {
            return true;
        },
    },
    methods: {
        async submit() {
            if (this.busy) return;

            this.busy = true;

            try {
                const user = await useHTTPClient().user.update(this.id, {
                    password: this.form.password,
                    password_repeat: this.form.password_repeat,
                });

                this.$emit('updated', user);
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

        const password = buildFormInput<User>(this, h, {
            validationTranslator: buildVuelidateTranslator(vm.translatorLocale),
            title: 'Password',
            propName: 'password',
            attrs: {
                type: vm.form.passwordShow ? 'text' : 'password',
                autocomplete: 'new-password',
            },
        });

        const passwordRepeat = buildFormInput(this, h, {
            validationTranslator: buildVuelidateTranslator(vm.translatorLocale),
            title: 'Password repeat',
            propName: 'password_repeat',
            attrs: {
                type: vm.form.passwordShow ? 'text' : 'password',
                autocomplete: 'new-password',
            },
        });

        const showPassword = h('div', {
            staticClass: 'form-group mb-1',
        }, [
            h('b-form-checkbox', {
                attrs: {
                    switch: '',
                },
                model: {
                    value: vm.form.passwordShow,
                    callback(v: boolean) {
                        vm.form.passwordShow = v;
                    },
                    expression: 'form.passwordShow',
                },
            } as VNodeData, [
                'Password ',
                (vm.form.passwordShow ? 'hide' : 'show'),
            ]),
        ]);

        const submit = buildFormSubmit(vm, h, {
            updateText: useAuthIlingo().getSync('form.update.button'),
            createText: useAuthIlingo().getSync('form.create.button'),
        });

        return h('form', {
            on: {
                submit($event: any) {
                    $event.preventDefault();

                    return vm.submit.apply(null);
                },
            },
        }, [
            password,
            passwordRepeat,
            showPassword,
            submit,
        ]);
    },
});

export default UserPasswordForm;
