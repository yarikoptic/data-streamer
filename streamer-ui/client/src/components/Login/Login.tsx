import React, { useState, useContext } from "react";
import {
    Card,
    Form,
    Icon,
    Button,
    Input,
    Layout,
    Row,
    Col,
    Tooltip,
    Spin,
    Modal
} from "antd";
import { FormComponentProps } from "antd/lib/form";
import { Redirect } from "react-router-dom";
import axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from "axios";

import { AuthContext } from "../Auth/AuthContext";

import "../../App.less";
import logoDCCN from "../../assets/dccn-logo.png";

const { Content } = Layout;

interface IProps {
    title?: string | undefined;
}

function modalError(msg: string) {
    Modal.error({
        title: 'Error',
        content: msg,
        onOk() {
            Modal.destroyAll();
        }
    });
}

const LoginForm: React.FC<IProps & FormComponentProps> = ({ form }) => {
    const authContext = useContext(AuthContext);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loggingIn, setLoggingIn] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const { getFieldDecorator } = form;
    const antIcon = <Icon type="loading" style={{ fontSize: 24, margin: 10 }} spin />;

    const handleLoginResponse = (response: AxiosResponse) => {
        if (response.data) {
            if (response.data.error) {
                const error = new Error(response.data.error);
                setIsAuthenticated(() => false);
                setLoggingIn(() => false);
                setHasSubmitted(() => false);
                modalError(error.message);
                return error;
            }
            setIsAuthenticated(() => true);
            setLoggingIn(() => false);
            setHasSubmitted(() => false);
            setUsername(() => username);
            setPassword(() => password);
            authContext!.authenticate(username, password);
        }
    };

    const handleLoginError = (error: AxiosError) => {
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
        setIsAuthenticated(() => false);
        setLoggingIn(() => false);
        setHasSubmitted(() => false);
        modalError(errorMessage);
        return error;
    };

    const handleLogin = (username: string, password: string) => {
        return new Promise((resolve) => {
            const config: AxiosRequestConfig = {
                url: "/login",
                method: "post",
                timeout: 1000,
                withCredentials: true,
                auth: {
                    username: username,
                    password: password
                },
                data: {
                    username: username,
                    password: password
                },
                responseType: "json"
            };

            resolve(
                axios(config)
                    .then(handleLoginResponse)
                    .catch(handleLoginError));
        });
    };

    const handleSubmit = (event: any) => {
        event.preventDefault();
        setUsername(() => username);
        setPassword(() => password);
        setIsAuthenticated(() => false);
        setLoggingIn(() => true);
        setHasSubmitted(() => true);
        handleLogin(username, password);
    };

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const username = e.target.value;
        setUsername(() => username);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const password = e.target.value;
        setPassword(() => password);
    };

    return (
        <div>
            {
                authContext!.isAuthenticated &&
                <Redirect to="/" />
            }
            {/* {
                !authContext!.isAuthenticated &&
                <Button
                    onClick={() => authContext!.authenticate("rutvdee", "testpassword")}>
                    Authenticate rutvdee
                </Button>
            } */}
            {
                isAuthenticated &&
                <Redirect to="/" />
            }
            {
                loggingIn && hasSubmitted && !isAuthenticated &&
                <Content style={{ background: "#f0f2f5", marginTop: "10px" }}>
                    <Spin indicator={antIcon} />
                </Content>
            }
            {
                !loggingIn && !hasSubmitted && !isAuthenticated &&
                <Content style={{ background: "#f0f2f5", marginTop: "10px" }}>
                    <Row justify="center" style={{ height: "100%" }}>
                        <Col span={10}>
                        </Col>
                        <Col span={4}>
                            <Card
                                style={{
                                    borderRadius: 4,
                                    boxShadow: "1px 1px 1px #ddd",
                                    marginTop: 10,
                                    width: "350px"
                                }}
                                className="shadow"
                            >
                                <div style={{ display: "flex", justifyContent: "center", marginBottom: 30 }}>
                                    <img alt="Donders Institute" src={logoDCCN} height={64} />
                                </div>
                                <Form className="login-form" onSubmit={handleSubmit}>
                                    <Form.Item>
                                        {getFieldDecorator("username", {
                                            rules: [{ required: true, message: "Please input your DCCN username" }]
                                        })(
                                            <Input
                                                prefix={<Icon type="user" style={{ color: "rgba(0,0,0,.25)" }} />}
                                                placeholder="DCCN Username"
                                                onChange={handleUsernameChange}
                                            />,
                                        )}
                                    </Form.Item>
                                    <Form.Item>
                                        {getFieldDecorator("password", {
                                            rules: [{ required: true, message: "Please input your password" }]
                                        })(
                                            <Input
                                                prefix={<Icon type="lock" style={{ color: "rgba(0,0,0,.25)" }} />}
                                                type="password"
                                                placeholder="Password"
                                                onChange={handlePasswordChange}
                                            />,
                                        )}
                                    </Form.Item>
                                    <Form.Item>
                                        <Button className="login-form-button" type="primary" htmlType="submit">
                                            Log in
                                        </Button>
                                    </Form.Item>
                                    <div style={{ display: "flex", justifyContent: "center" }}>
                                        <Tooltip title="This is the login page for the data streamer UI. Please login with your DCCN credentials.">
                                            <Icon type="question-circle" />
                                        </Tooltip>
                                    </div>
                                </Form>
                            </Card>
                        </Col>
                        <Col span={10}>
                        </Col>
                    </Row>
                </Content>
            }
        </div>
    );
};

const Login = Form.create<IProps & FormComponentProps>()(LoginForm);

export default Login;
