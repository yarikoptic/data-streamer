import React from "react";
import {
    Select,
    Form,
    Row,
    Col,
    Icon,
    Input,
    Tooltip
} from "antd";
import { FormComponentProps } from "antd/lib/form";
import { Project, SelectOption } from "./types";

import { validateSubjectLabelInput, validateSessionLabelInput, validateSelectedDataTypeOtherInput } from "./utils";

const { Option } = Select;

interface IProps {
    projectList: Project[];
    isSelectedProject: boolean;
    projectNumber: string;
    isSelectedSubject: boolean;
    subjectLabel: string;
    isSelectedSession: boolean;
    isSelectedDataType: boolean;
    isSelectedDataTypeOther: boolean;
    dataType: string;
    sessionLabel: string;
    handleSelectProjectValue: (value: SelectOption) => void;
    handleChangeSubjectLabel: (event: any) => void;
    handleChangeSessionLabel: (event: any) => void;
    handleSelectDataTypeValue: (value: SelectOption) => void;
    handleChangeSelectedDataTypeOther: (event: any) => void;
}

const dataTypesList = [
    {
        id: 1,
        dataType: "mri"
    },
    {
        id: 2,
        dataType: "meg"
    },
    {
        id: 3,
        dataType: "eeg"
    },
    {
        id: 4,
        dataType: "ieeg"
    },
    {
        id: 5,
        dataType: "beh"
    },
    {
        id: 6,
        dataType: "other"
    }
];

const StructureSelectorForm: React.FC<IProps & FormComponentProps> = (
    {
        form,
        projectList,
        isSelectedProject,
        projectNumber,
        isSelectedSubject,
        subjectLabel,
        isSelectedSession,
        isSelectedDataType,
        isSelectedDataTypeOther,
        dataType,
        sessionLabel,
        handleSelectProjectValue,
        handleChangeSubjectLabel,
        handleChangeSessionLabel,
        handleSelectDataTypeValue,
        handleChangeSelectedDataTypeOther
    }) => {
    const { getFieldDecorator } = form;

    const defaultEmpty: SelectOption = { key: "" };

    const optionsProjects = projectList.map((project, key) => (
        <Option value={project.number}>{project.number}</Option>
    ));

    const optionsDataTypes = dataTypesList.map((item, key) => (
        <Option value={item.dataType}>{item.dataType}</Option>
    ));

    const validateSubjectLabel = async (rule: any, value: string) => {
        let isValid = validateSubjectLabelInput(value);
        if (!isValid) {
            throw new Error("Must be of form [a-zA-Z0-9]+");
        }
    };

    const validateSessionLabel = async (rule: any, value: string) => {
        let isValid = validateSessionLabelInput(value);
        if (!isValid) {
            throw new Error("Must be of form [a-zA-Z0-9]+");
        }
    };

    const validateDataTypeOther = async (rule: any, value: string) => {
        let isValid = validateSelectedDataTypeOtherInput(value);
        if (!isValid) {
            throw new Error("Must be of form [a-z]+");
        }
    };

    return (
        <Form layout="vertical" hideRequiredMark>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item label="Project number">
                        <Select
                            labelInValue
                            defaultValue={defaultEmpty}
                            placeholder="Select project"
                            onSelect={handleSelectProjectValue}
                            style={{ width: "400px" }}
                        >
                            {optionsProjects}
                        </Select>
                        &nbsp;
                        <Tooltip title="only the projects are shown for which you are manager or contributor">
                            <Icon type="question-circle-o" />
                        </Tooltip>
                    </Form.Item>
                </Col>
                <Col span={12}></Col>
            </Row>

            {isSelectedProject && (
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Set subject label">
                            {getFieldDecorator("subjectlabel", {
                                rules: [
                                    { required: true, message: "Please input your subject label" },
                                    { validator: validateSubjectLabel }
                                ]
                            })(
                                <Input
                                    placeholder="Set subject label"
                                    onChange={handleChangeSubjectLabel}
                                    style={{ width: "400px" }}
                                />,
                            )}
                            &nbsp;
                            <Tooltip title="subject label must be of form [a-zA-Z0-9]+">
                                <Icon type="question-circle-o" />
                            </Tooltip>
                        </Form.Item>
                    </Col>
                    <Col span={12}></Col>
                </Row>
            )}

            {isSelectedSubject && (
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Set session label">
                            {getFieldDecorator("sessionlabel", {
                                rules: [
                                    { required: true, message: "Please input your session label" },
                                    { validator: validateSessionLabel }
                                ]
                            })(
                                <Input
                                    placeholder="Set session label"
                                    onChange={handleChangeSessionLabel}
                                    style={{ width: "400px" }}
                                />,
                            )}
                            &nbsp;
                            <Tooltip title="session label must be of form [a-zA-Z0-9]+">
                                <Icon type="question-circle-o" />
                            </Tooltip>,
                        </Form.Item>
                    </Col>
                    <Col span={12}></Col>
                </Row>
            )}

            {isSelectedSession && (
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Select data type">
                            <Select
                                labelInValue
                                defaultValue={defaultEmpty}
                                placeholder="Select data type"
                                onSelect={handleSelectDataTypeValue}
                                style={{ width: "400px" }}
                            >
                                {optionsDataTypes}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}></Col>
                </Row>
            )}

            {isSelectedDataTypeOther && (
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item>
                            {getFieldDecorator("datatypeother", {
                                rules: [
                                    { required: true, message: "Please input your other data type" },
                                    { validator: validateDataTypeOther }
                                ]
                            })(
                                <Input
                                    placeholder="Insert other data type"
                                    onChange={handleChangeSelectedDataTypeOther}
                                    style={{ width: "400px" }}
                                />,
                            )}
                            &nbsp;
                            <Tooltip title="other data type must be lower case string with no special characters">
                                <Icon type="question-circle-o" />
                            </Tooltip>
                        </Form.Item>
                    </Col>
                    <Col span={12}></Col>

                </Row>
            )}
        </Form>
    );
};

const StructureSelector = Form.create<IProps & FormComponentProps>()(StructureSelectorForm);

export default StructureSelector;
