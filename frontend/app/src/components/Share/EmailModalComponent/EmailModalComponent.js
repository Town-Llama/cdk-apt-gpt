import { useEffect, useState } from 'react';
import { Button, Form, Input, List, Icon, Segment, Modal } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import DynamoDBUtil from '../../utils/AWS/DynamoDBUtil';
import { useAuth0 } from "@auth0/auth0-react";
import { useSelector, useDispatch } from 'react-redux';

import { updateShares } from '../../../store/actions/shareActions';  // Adjust the import path as necessary


const EmailModalComponent = ( {modalOpen, setModalOpen} ) => {
    const [email, setEmail] = useState('');
    const [emails, setEmails] = useState([]);

    const dispatch = useDispatch();
    const { hash } = useSelector(state=> state.rec);

    const {
        user
    } = useAuth0();

    useEffect(()=>{
        process();
    }, [])

    const process = async () => {
        const ddbClient = new DynamoDBUtil();
        const res = await ddbClient.queryItems_shares(user.email, hash);
        const emails = [];
        for (let i = 0; i < res.length; i++){
            emails.push(res[i].sharee.S);
        }

        if (res) {
            dispatch(updateShares(emails));
        }
        setEmails(res ? emails : []);
    }

    const handleAddEmail = async () => {
        if (email && !emails.includes(email)) {
            let emailArr = [...emails];
            const ddbClient = new DynamoDBUtil();
            await ddbClient.putItem({
                ownerPlusHash: user.email+"§"+hash,
                sharee: email
            }, "Shares");
            emailArr.push(email);
            setEmails(emailArr);
            dispatch(updateShares(emailArr));
            setEmail('');
        }
    };

    const handleDeleteEmail = async (emailToDelete) => {
        const emailArr = emails.filter(e => e !== emailToDelete)
        setEmails(emailArr);
        const ddbClient = new DynamoDBUtil();
        await ddbClient.deleteItem("Shares", {
            ownerPlusHash: user.email+"§"+hash,
            sharee: emailToDelete,
        });
        dispatch(updateShares(emailArr));
    };

    const handleClose = () => setModalOpen(false);

    return (
        <div>
            <Modal open={modalOpen} onClose={handleClose} size="small">
                <Modal.Header>Send Recommendations</Modal.Header>
                <Modal.Content>
                    <Segment>
                        <Form onSubmit={handleAddEmail}>
                            <Form.Field>
                                <Input
                                    type="email"
                                    placeholder="Enter email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    action={
                                        <Button type="submit" color="blue">
                                            Add Email
                                        </Button>
                                    }
                                />
                            </Form.Field>
                        </Form>
                        <List divided relaxed>
                            {emails.map((email, index) => (
                                <List.Item key={index}>
                                    <List.Content floated="right">
                                        <Button
                                            icon
                                            color="red"
                                            onClick={() => handleDeleteEmail(email)}
                                        >
                                            <Icon name="delete" />
                                        </Button>
                                    </List.Content>
                                    <List.Content>{email}</List.Content>
                                </List.Item>
                            ))}
                        </List>
                    </Segment>
                </Modal.Content>
                <Modal.Actions>
                    <Button color="red" onClick={handleClose}>
                        Close
                    </Button>
                </Modal.Actions>
            </Modal>
        </div>
    );
};

export default EmailModalComponent;
