'use client';
import React from 'react';
import type { FormProps } from 'antd';
import { Button, Form, Select } from 'antd';
import Test from './test'

type FieldType = {
    nome?: string;
    bebida?: string;
    data?: any;
};


const onFinish: FormProps<FieldType>['onFinish'] = (values) => {

    Test(values)

}

const dataAtual = new Date();

const FormComand: React.FC = () => (

    <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600, paddingTop: 50 }}
        onFinish={onFinish}
        autoComplete="off"
        clearOnDestroy
    >
        <Form.Item<FieldType>
            name="nome"
            label="Nome"
            rules={[{ required: true, message: 'Selecione ao menos um nome!' }]}
        >
            <Select>
                <Select.Option value="Alex">Alex</Select.Option>
                <Select.Option value="André">André</Select.Option>
                <Select.Option value="Athayde">Athayde</Select.Option>
                <Select.Option value="Bacelar">Bacelar</Select.Option>
                <Select.Option value="Baeza">Baeza</Select.Option>
                <Select.Option value="Beto">Beto</Select.Option>
                <Select.Option value="Cláudio">Cláudio</Select.Option>
                <Select.Option value="Fernando">Fernando</Select.Option>
                <Select.Option value="Giuliano">Giuliano</Select.Option>
                <Select.Option value="Gulitich">Gulitich</Select.Option>
                <Select.Option value="Índio">Índio</Select.Option>
                <Select.Option value="Jeferson">Jeferson</Select.Option>
                <Select.Option value="João Marius">João Marius</Select.Option>
                <Select.Option value="Madalosso">Madalosso</Select.Option>
                <Select.Option value="Maicon">Maicon</Select.Option>
                <Select.Option value="Mega">Mega</Select.Option>
                <Select.Option value="Mortari">Mortari</Select.Option>
                <Select.Option value="Pacheco">Pacheco</Select.Option>
                <Select.Option value="Rafael">Rafael</Select.Option>
                <Select.Option value="Rodrigo N.D">Rodrigo N.D</Select.Option>
                <Select.Option value="Rodrigo">Rodrigo</Select.Option>
                <Select.Option value="Rogério">Rogério</Select.Option>
                <Select.Option value="Weriton">Weriton</Select.Option>
                <Select.Option value="Zanona">Zanona</Select.Option>
                <Select.Option value="Zeca">Zeca</Select.Option>
                <Select.Option value="Zé Carlos">Zé Carlos</Select.Option>
                <Select.Option value="Robson">Robson</Select.Option>
                <Select.Option value="Romanel">Romanel</Select.Option>
            </Select>
        </Form.Item>

        <Form.Item<FieldType>
            name="bebida"
            label="Bebidas"
            rules={[{ required: true, message: 'Selecione ao menos um item!' }]}
        >
            <Select>
                <Select.Option value="Long Neck">Long Neck</Select.Option>
                <Select.Option value="Refrigerante">Refrigerante</Select.Option>
                <Select.Option value="Água">Água</Select.Option>
            </Select>
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type="primary" htmlType="submit">
                Adicionar
            </Button>
        </Form.Item>

        <Form.Item<FieldType>
            name="data"
            label="Data Atual"
            initialValue={dataAtual.toDateString()}
        >
            {dataAtual.toDateString()}
        </Form.Item>
    </Form>

);

export default FormComand;