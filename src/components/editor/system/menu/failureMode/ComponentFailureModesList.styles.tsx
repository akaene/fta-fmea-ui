import {makeStyles} from "@material-ui/core";
import {createStyles} from "@material-ui/core/styles";

const useStyles = makeStyles(() =>
    createStyles({
        failureModes: {
            width: '100%'
        },
        actionButton: {
            alignSelf: 'flex-end'
        },
        editHeader:{
            display: 'flex',
            justifyContent: 'space-between'
        }
    }),
);

export default useStyles;
