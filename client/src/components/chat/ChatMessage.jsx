import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  SmartToy as BotIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const ChatMessage = ({ message, isUser }) => {
  const handleCopy = () => {
    if (message?.content) {
      navigator.clipboard.writeText(message.content);
    }
  };

  if (!message?.content) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 1,
        alignItems: 'flex-start'
      }}
    >
      <Avatar
        sx={{
          bgcolor: isUser ? 'primary.main' : 'secondary.main',
          width: 32,
          height: 32
        }}
      >
        {isUser ? <PersonIcon /> : <BotIcon />}
      </Avatar>

      <Box sx={{ maxWidth: '75%' }}>
        <Paper
          sx={{
            p: 1.5,
            bgcolor: isUser ? 'primary.light' : 'grey.100',
            borderRadius: 2,
            position: 'relative'
          }}
        >
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>

          <Box
            sx={{
              position: 'absolute',
              top: 4,
              right: isUser ? 'auto' : 4,
              left: isUser ? 4 : 'auto',
              opacity: 0,
              transition: 'opacity 0.2s',
              '&:hover': {
                opacity: 1
              }
            }}
          >
            <Tooltip title="Copy message">
              <IconButton
                size="small"
                onClick={handleCopy}
                sx={{ color: 'action.active' }}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            textAlign: isUser ? 'right' : 'left',
            mt: 0.5
          }}
        >
          {message.timestamp ? format(new Date(message.timestamp), 'HH:mm') : ''}
        </Typography>
      </Box>
    </Box>
  );
};

export default ChatMessage; 