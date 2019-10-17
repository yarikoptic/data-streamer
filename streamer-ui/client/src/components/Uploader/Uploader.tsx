import React, { useState, useContext, useEffect } from "react";
import {
    Layout,
    Row,
    Col,
    Card,
    Icon,
    Button,
    Divider,
    BackTop,
    Spin,
    Modal,
    Progress
} from "antd";
import axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from "axios";

import { AuthContext } from "../Auth/AuthContext";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import FileSelector from "./FileSelector";
import FileList from "./FileList";
import TargetPath from "./TargetPath";
import StructureSelector from "./StructureSelector";
import { fetchProjectList } from "./fetch";
import { RcFile, Project, SelectOption } from "./types";
import { validateSubjectLabelInput, validateSessionLabelInput, validateSelectedDataTypeOtherInput } from "./utils";

const { Content } = Layout;

// 1 GB = 1024 * 1024 * 1024 bytes = 1073741824 bytes
const maxSizeLimitBytes = 1073741824;
const maxSizeLimitAsString = "1 GB";

// 5 minutes = 5 * 60 * 1000 ms = 300000 ms
const uploadTimeout = 300000;

function modalError(msg: string) {
    Modal.error({
        title: "Error",
        content: msg,
        onOk() {
            Modal.destroyAll();
        }
    });
}

const Uploader: React.FC = () => {
    const authContext = useContext(AuthContext);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadingPercentage, setUploadingPercentage] = useState(0);
    const [isUploading, setIsUploading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [isLoadingProjectList, setIsLoadingProjectList] = useState(true);
    const [projectList, setProjectList] = useState([] as Project[]);
    const [selectedProjectValue, setSelectedProjectValue] = useState("");
    const [selectedSubjectValue, setSelectedSubjectValue] = useState("");
    const [selectedSessionValue, setSelectedSessionValue] = useState("");
    const [selectedDataTypeValue, setSelectedDataTypeValue] = useState("");
    const [isSelectedProject, setIsSelectedProject] = useState(false);
    const [isSelectedSubject, setIsSelectedSubject] = useState(false);
    const [isSelectedSession, setIsSelectedSession] = useState(false);
    const [isSelectedDataType, setIsSelectedDataType] = useState(false);
    const [isSelectedDataTypeOther, setIsSelectedDataTypeOther] = useState(false);
    const [fileList, setFileList] = useState([] as RcFile[]);
    const [fileListSummary, setFileListSummary] = useState(0);
    const [hasFilesSelected, setHasFilesSelected] = useState(false);
    const [proceed, setProceed] = useState(false);
    const antIcon = <Icon type="loading" style={{ fontSize: 24, margin: 10 }} spin />;

    useEffect(() => {
        const fetchData = async (username: string, password: string) => {
            setIsLoadingProjectList(true);
            const data = await fetchProjectList(username, password);
            setProjectList(data);
            setIsLoadingProjectList(false);
        };
        fetchData(authContext!.username, authContext!.password);
    }, [authContext]);

    const handleUploadResponse = (response: AxiosResponse) => {
        // console.log(response.data);
        // console.log(response.status);
        // console.log(response.statusText);
        // console.log(response.headers);
        // console.log(response.config);
        return response;
    };

    const handleUploadError = (error: AxiosError) => {
        var errorMessage = "";
        if (error.response) {
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
            errorMessage = JSON.stringify(error.response.data, null, 2);
        } else {
            console.log(error.message);
            errorMessage = error.message;
        }
        console.log(errorMessage);
        modalError(errorMessage);
        return error;
    };

    const handleUploadRequest = (username: string, password: string, formData: any) => {
        return new Promise((resolve) => {
            const config: AxiosRequestConfig = {
                url: "/upload",
                method: "post",
                headers: { "Content-Type": "multipart/form-data" },
                data: formData,
                timeout: uploadTimeout,
                withCredentials: true,
                auth: {
                    username: username,
                    password: password
                },
                responseType: "json"
            };

            resolve(
                axios.request(config)
                    .then(handleUploadResponse)
                    .then(function (response: AxiosResponse) {
                        let value = uploadingPercentage + Math.floor(100.0 / fileList.length);
                        setUploadingPercentage(uploadingPercentage => uploadingPercentage + Math.floor(100.0 / fileList.length));
                        return value;
                    })
                    .catch(handleUploadError));
        });
    };

    function dummyAxiosRequest<T = any, R = AxiosResponse<T>>(config: AxiosRequestConfig): Promise<R> {
        const promise = new Promise<R>(function (resolve, reject) {
            setTimeout(function () {
                let response = {
                    data: { test: "test" },
                    status: 200,
                    statusText: "OK",
                    headers: {},
                    config: config
                } as unknown as (R | PromiseLike<R> | undefined);
                resolve(response);
            }, 10);
        });
        return promise;
    }

    const handleDummyUploadRequest = (username: string, password: string, formData: any) => {
        return new Promise((resolve) => {
            const config: AxiosRequestConfig = {
                url: "/upload",
                method: "post",
                headers: { "Content-Type": "multipart/form-data" },
                data: formData,
                timeout: uploadTimeout,
                withCredentials: true,
                auth: {
                    username: username,
                    password: password
                },
                responseType: "json"
            };

            resolve(
                dummyAxiosRequest(config)
                    .then(handleUploadResponse)
                    .then(function (response: AxiosResponse) {
                        let value = uploadingPercentage + Math.floor(100.0 / fileList.length);
                        setUploadingPercentage(uploadingPercentage => uploadingPercentage + Math.floor(100.0 / fileList.length));
                        return value;
                    })
                    .catch(handleUploadError));
        });
    };

    const handleUpload = (event: any) => {
        setUploadingPercentage(uploadingPercentage => 0);
        setIsUploading(true);
        setShowUploadModal(true);

        let work = [] as Promise<unknown>[];
        fileList.forEach((file: any) => {
            var formData = new FormData();

            // Add the attributes
            formData.append("projectNumber", selectedProjectValue);
            formData.append("subjectLabel", selectedSubjectValue);
            formData.append("sessionLabel", selectedSessionValue);
            formData.append("dataType", selectedDataTypeValue);

            formData.append("filename", file.name);
            formData.append("filesize", file.size);
            formData.append("uid", file.uid);

            // Add one file
            formData.append("files", file);

            const p = handleUploadRequest(authContext!.username, authContext!.password, formData);
            // const p = handleDummyUploadRequest(authContext!.username, authContext!.password, formData);
            work.push(p.catch(error => {
                setFailed(true);
                setIsUploading(false);
                console.log(error);
                modalError(error.message);
            }));
        });

        Promise.all(work).then(function (results) {
            setUploadingPercentage(uploadingPercentage => 100);
            setIsUploading(false);
            setFailed(false);
            console.log(results);
        });
    };

    const handleDelete = (uid: string, filename: string, size: number) => {
        const fileListUpdated = fileList.filter(
            (item: any) => item.name !== filename && item.uid !== uid
        );
        const hasFilesSelectedUpdated = fileListUpdated.length > 0;
        setHasFilesSelected(hasFilesSelectedUpdated);
        setFileList(fileListUpdated);
        setFileListSummary(fileListSummary => fileListSummary - size);
    };

    const handleDeleteList = () => {
        setHasFilesSelected(false);
        setFileList([] as RcFile[]);
        setFileListSummary(0);
    };

    const fileNameExists = (file: RcFile, fileList: RcFile[]) => {
        const duplicates = fileList.filter(
            item => item.name === file.name && item.uid !== file.uid
        );
        if (duplicates.length > 0) {
            return true;
        } else {
            return false;
        }
    };

    const handleBeforeUpload = (file: RcFile, batch: RcFile[]) => {
        let isValidBatch = true;
        let maxFileSizeExceeded = false;
        let largeFiles = [] as string[];
        let duplicates = [] as string[];
        // TODO: Find a way to do this check only once (i.e. per batch)
        for (let i = 0; i < batch.length; i++) {
            if (file.size >= maxSizeLimitBytes) {
                largeFiles.push(batch[i].name);
                maxFileSizeExceeded = true;
                isValidBatch = false;
            }
            if (fileNameExists(batch[i], fileList)) {
                duplicates.push(batch[i].name);
                isValidBatch = false;
            }
        }
        if (isValidBatch) {
            setHasFilesSelected(true);
            setFileList(fileList => [...fileList, file]);
            setFileListSummary(fileListSummary => fileListSummary + file.size);
        } else {
            setFileList(fileList => [...fileList]);
            setHasFilesSelected(fileList.length > 0);
            setFileListSummary(fileListSummary => fileListSummary);
            let msg = "";
            if (duplicates.length === 1) {
                msg = `Filename already exists, please rename: "${duplicates[0]}"`;
            } else {
                msg = `Filenames already exist, please rename: [${duplicates.join(", ")}]`;
            }
            if (duplicates.length === 0 && maxFileSizeExceeded) {
                if (largeFiles.length === 1) {
                    msg = `Maximum file size exceeded (file size must be less than ${maxSizeLimitAsString} for a single file): "${largeFiles[0]}"`;
                } else {
                    msg = `Maximum file size exceeded (file size must be less than ${maxSizeLimitAsString} for a single file): [${largeFiles.join(", ")}]`;
                }
            }
            modalError(msg);
        }
        return true; // bypass default behaviour
    };

    const handleSelectProjectValue = (value: SelectOption) => {
        setSelectedProjectValue(value.key);
        setIsSelectedProject(true);
        setSelectedSubjectValue("");
        setIsSelectedSubject(false);
        setSelectedSessionValue("");
        setIsSelectedSession(false);
        setSelectedDataTypeValue("");
        setIsSelectedDataType(false);
        setIsSelectedDataTypeOther(false);
        setProceed(false);
    };

    const handleChangeSubjectLabel = (event: any) => {
        let isValid = validateSubjectLabelInput(event.target.value);
        if (isValid) {
            setSelectedSubjectValue(event.target.value);
            setIsSelectedSubject(true);
            setSelectedSessionValue("");
            setIsSelectedSession(false);
            setSelectedDataTypeValue("");
            setIsSelectedDataType(false);
            setIsSelectedDataTypeOther(false);
            setProceed(false);
        } else {
            let value = event.target.value;
            // Do not store invalid strings.
            // Silently reset in case of empty string.
            if (value !== "") {
                value = selectedSubjectValue;
            }
            setSelectedSubjectValue(value);
            setIsSelectedSubject(false);
            setSelectedSessionValue("");
            setIsSelectedSession(false);
            setSelectedDataTypeValue("");
            setIsSelectedDataType(false);
            setIsSelectedDataTypeOther(false);
            setProceed(false);
        }
    };

    const handleChangeSessionLabel = (event: any) => {
        let isValid = validateSessionLabelInput(event.target.value);
        if (isValid) {
            setSelectedSessionValue(event.target.value);
            setIsSelectedSession(true);
            setSelectedDataTypeValue("");
            setIsSelectedDataType(false);
            setIsSelectedDataTypeOther(false);
            setProceed(false);
        } else {
            let value = event.target.value;
            // Do not store invalid strings.
            // Silently reset in case of empty string.
            if (value !== "") {
                value = selectedSessionValue;
            }
            setSelectedSessionValue(value);
            setIsSelectedSession(false);
            setSelectedDataTypeValue("");
            setIsSelectedDataType(false);
            setIsSelectedDataTypeOther(false);
            setProceed(false);
        }
    };

    const handleSelectDataTypeValue = (value: SelectOption) => {
        setSelectedDataTypeValue(value.key);
        setIsSelectedDataType(true);
        setIsSelectedDataTypeOther(false);
        let proceed = true;
        if (value.key === "other") {
            setIsSelectedDataTypeOther(true);
            proceed = false;
        }
        setProceed(proceed);
    };

    const handleChangeSelectedDataTypeOther = (event: any) => {
        let isValid = validateSelectedDataTypeOtherInput(event.target.value);
        if (isValid) {
            setSelectedDataTypeValue(event.target.value);
            setProceed(true);
        } else {
            let value = event.target.value;
            // Do not store invalid strings.
            // Silently reset in case of empty string.
            if (value !== "") {
                value = selectedDataTypeValue;
            }
            setSelectedDataTypeValue(value);
            setProceed(false);
        }
    };

    return (
        <Content style={{ background: "#f0f2f5" }}>
            <Header />
            <div style={{ padding: 10 }}>
                <Row>
                    <Col span={12}>
                        <Card
                            style={{
                                borderRadius: 4,
                                boxShadow: "1px 1px 1px #ddd",
                                minHeight: "600px",
                                marginTop: 10
                            }}
                            className="shadow"
                        >
                            <table style={{ width: "100%" }}>
                                <tr>
                                    <td><h2>Local PC</h2></td>
                                </tr>
                            </table>
                            <Divider />
                            <FileSelector
                                fileList={fileList}
                                fileListSummary={fileListSummary}
                                hasFilesSelected={hasFilesSelected}
                                handleBeforeUpload={handleBeforeUpload}
                            />
                            <br />
                            <br />
                            <FileList
                                fileList={fileList}
                                fileListSummary={fileListSummary}
                                hasFilesSelected={hasFilesSelected}
                                handleDelete={handleDelete}
                                handleDeleteList={handleDeleteList}
                            />
                            <div>
                                <BackTop />
                            </div>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card
                            style={{
                                marginLeft: 10,
                                borderRadius: 4,
                                boxShadow: "1px 1px 1px #ddd",
                                minHeight: "600px",
                                marginTop: 10
                            }}
                            className="shadow"
                        >
                            <table style={{ width: "100%" }}>
                                <tr>
                                    <td>
                                        <h2>Project storage</h2>
                                    </td>
                                    <td style={{ float: "right" }}>
                                        <TargetPath
                                            isSelectedProject={isSelectedProject}
                                            projectNumber={selectedProjectValue}
                                            isSelectedSubject={isSelectedSubject}
                                            subjectLabel={selectedSubjectValue}
                                            isSelectedSession={isSelectedSession}
                                            sessionLabel={selectedSessionValue}
                                            isSelectedDataType={isSelectedDataType}
                                            dataType={selectedDataTypeValue}
                                        />
                                    </td>
                                </tr>
                            </table>
                            <Divider />
                            {isLoadingProjectList &&
                                <Content style={{ marginTop: "10px" }}>
                                    <div>Loading projects for {authContext!.username} ...</div>
                                    <Spin indicator={antIcon} />
                                </Content>
                            }
                            {!isLoadingProjectList &&
                                <StructureSelector
                                    projectList={projectList}
                                    isSelectedProject={isSelectedProject}
                                    projectNumber={selectedProjectValue}
                                    isSelectedSubject={isSelectedSubject}
                                    subjectLabel={selectedSubjectValue}
                                    isSelectedSession={isSelectedSession}
                                    sessionLabel={selectedSessionValue}
                                    isSelectedDataType={isSelectedDataType}
                                    isSelectedDataTypeOther={isSelectedDataTypeOther}
                                    dataType={selectedDataTypeValue}
                                    handleSelectProjectValue={handleSelectProjectValue}
                                    handleChangeSubjectLabel={handleChangeSubjectLabel}
                                    handleChangeSessionLabel={handleChangeSessionLabel}
                                    handleSelectDataTypeValue={handleSelectDataTypeValue}
                                    handleChangeSelectedDataTypeOther={handleChangeSelectedDataTypeOther}
                                />
                            }
                            {isSelectedSession && hasFilesSelected && proceed && (
                                <Button
                                    size="large"
                                    style={{
                                        backgroundColor: "#52c41a",
                                        color: "#fff",
                                        width: "200px",
                                        float: "right"
                                    }}
                                    onClick={handleUpload}
                                >
                                    Upload
                                </Button>
                            )}
                            {(!hasFilesSelected || !proceed) && (
                                <Button
                                    disabled={true}
                                    size="large"
                                    style={{ width: "200px", float: "right" }}
                                >
                                    Upload
                                </Button>
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>
            <Footer />
            <Modal
                title="Uploading"
                visible={showUploadModal}
                closable={false}
                footer={[
                    <Button type="primary" disabled={isUploading} onClick={(e) => {
                        setShowUploadModal(false);
                        setFailed(false);

                        // Keep projectList, projectNumber, subject, session, dataType, etc. but refresh the filelist
                        setFileList([] as RcFile[]);
                        setFileListSummary(0);
                        setHasFilesSelected(false);
                    }}>
                        Upload another batch
                    </Button>,
                    <Button disabled={isUploading} onClick={(e) => authContext!.signout()}>
                        Log out
                    </Button>
                ]}
            >
                {
                    !failed && (
                        <Progress percent={uploadingPercentage} />)
                }
                {
                    failed && (
                        <Progress status="exception" percent={uploadingPercentage} />)
                }
                {
                    isUploading && (
                        <div>
                            <p>This may take a while ...</p>
                            <p style={{ fontWeight: "bold" }}>Do not close the browser</p>
                            <Spin indicator={antIcon} />
                        </div>)
                }
                {
                    !isUploading && !failed && (
                        <div>
                            <p>Done</p>
                        </div>)
                }
                {
                    !isUploading && failed && (
                        <div>
                            <p>Failed</p>
                        </div>)
                }
            </Modal>
        </Content >
    );
};

export default Uploader;
