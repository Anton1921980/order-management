import { memo } from 'react';
import { AppBar, Toolbar, Typography, Box, Select, MenuItem, FormControl, CircularProgress } from '@mui/material';
import { useAppContext } from '../context/AppContext';

const Header = memo(() => {
  const { users, currentUser, changeUser, userChangeLoading } = useAppContext();

  const handleUserChange = (event) => {
    changeUser(event.target.value);
  };

  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Order Management System
        </Typography>
        
        {users.length > 0 && (
          <Box sx={{ minWidth: 200, display: 'flex', alignItems: 'center' }}>
            {userChangeLoading && (
              <CircularProgress size={20} sx={{ color: 'white', mr: 2 }} />
            )}
            <FormControl fullWidth size="small">            
              <Select               
                id="user-select"
                value={currentUser?._id || ''}               
                onChange={handleUserChange}
                sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': {border:"none" } }}
                disabled={userChangeLoading}
              >
                {users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
});

export default Header;
